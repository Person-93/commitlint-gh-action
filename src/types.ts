import * as OctoTypes from "@octokit/types";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { getOctokit } from "@actions/github";
import * as CommitLintTypes from "@commitlint/types";
import { WithInput } from "@commitlint/types/lib/format";

export type Octokit = ReturnType<typeof getOctokit>;

type Api = ReturnType<typeof restEndpointMethods>;
export type Commits = OctoTypes.GetResponseDataTypeFromEndpointMethod<
    Api["rest"]["repos"]["listCommits"]
>;

export interface FormattableResult extends CommitLintTypes.FormattableResult {
    url: string;
}

export interface FormattableReport {
    results?: (FormattableResult & WithInput)[];
}

export interface LintOutcome extends CommitLintTypes.LintOutcome {
    url: string;
}
