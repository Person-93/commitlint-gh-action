import * as gh from "@actions/github";
import * as core from "@actions/core";
import load from "@commitlint/load";
import {
    ParserPreset,
    LintOptions,
    ParserOptions,
    QualifiedRules,
} from "@commitlint/types";
import { Commits, FormattableReport, Octokit, LintOutcome } from "./types";
import format from "./format";
import doLint from "@commitlint/lint";

main().catch((err) => {
    core.setFailed(err);
    core.debug(err.stack);
});

async function main() {
    const config = await load();
    if (Object.keys(config.rules).length == 0)
        throw new Error("There are no commitlint rules");

    const parserOptions = selectParserOptions(config.parserPreset);
    const commitlintOptions: LintOptions & { parserOptions: ParserOptions } = {
        parserOptions: parserOptions || {},
        plugins: config.plugins,
        ignores: config.ignores,
        defaultIgnores: config.defaultIgnores,
    };

    const context = gh.context;
    const token = core.getInput("token", { required: true }) as string;
    const octokit = gh.getOctokit(token);

    core.startGroup("Fetching commit messages...");
    const commits = await fetchCommits(octokit, context);
    core.endGroup();

    core.startGroup("Linting...");
    const results = await lint(commits, config.rules, commitlintOptions);
    const report = makeReport(results);
    const output = format(report, { color: false });
    if (!report.valid) core.setFailed(output);
    else if (output) core.info(output);
    core.endGroup();
}

function fetchCommits(octokit: Octokit, context: typeof gh.context) {
    const defaultParams = { ...context.repo, per_page: 100 };

    switch (context.eventName) {
        case "pull_request":
            return octokit.paginate(octokit.rest.pulls.listCommits, {
                ...defaultParams,
                pull_number: assertDefined(
                    context.payload.pull_request?.number,
                    "Missing pull request number"
                ),
            });

        case "push":
            return octokit.paginate(octokit.rest.repos.listCommits, {
                ...defaultParams,
                ref: context.ref,
            });

        default:
            return octokit.paginate(octokit.rest.repos.listCommits, defaultParams);
    }
}

function lint(
    commits: Commits,
    rules: QualifiedRules,
    options: LintOptions & { parserOptions: ParserOptions }
): Promise<LintOutcome[]> {
    return Promise.all(
        commits.map((commitData) =>
            doLint(commitData.commit.message, rules, options).then((outcome) => ({
                ...outcome,
                url: commitData.html_url,
            }))
        )
    );
}

function makeReport(outcomes: LintOutcome[]): FormattableReport & { valid: boolean } {
    return outcomes.reduce(
        (info, result) => {
            info.valid &&= result.valid;
            info.results.push(result);
            return info;
        },
        {
            valid: true as boolean,
            results: new Array<LintOutcome>(),
        }
    );
}

function assertDefined<T>(item: T | undefined, message?: string): T {
    if (item === undefined) throw new Error(message || "Unexpectedly undefined");
    return item;
}

function selectParserOptions(parserPreset: ParserPreset) {
    if (typeof parserPreset !== "object") return undefined;
    if (typeof parserPreset.parserOpts !== "object") return undefined;
    return parserPreset.parserOpts;
}
