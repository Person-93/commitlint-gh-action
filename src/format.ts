// adapted from https://github.com/conventional-changelog/commitlint/blob/dd15ea6a27f29f232b183acafdb672e9b3586912/@commitlint/format/src/format.ts

import chalk from "chalk";
import { ChalkColor, FormatOptions, WithInput } from "@commitlint/types";
import { FormattableReport, FormattableResult } from "./types";

const DEFAULT_SIGNS = [" ", "⚠", "✖"] as const;
const DEFAULT_COLORS = ["white", "yellow", "red"] as const;

export default function format(
    report: FormattableReport = {},
    options: FormatOptions = {}
): string {
    const { results = [] } = report;
    const fi = (result: FormattableResult & WithInput) => formatInput(result, options);
    const fr = (result: FormattableResult) => formatResult(result, options);

    return results
        .filter(
            (result) =>
                (Array.isArray(result.warnings) && result.warnings.length) ||
                (Array.isArray(result.errors) && result.errors.length)
        )
        .map((result) => [...fi(result), ...fr(result)])
        .reduce(
            (acc, item) => (Array.isArray(item) ? [...acc, ...item] : [...acc, item]),
            []
        )
        .join("\n");
}

function formatInput(
    result: FormattableResult & WithInput,
    options: FormatOptions = {}
): string[] {
    const { color: enabled = true } = options;
    const { errors = [], warnings = [], input = "" } = result;

    if (!input) {
        return [""];
    }

    const sign = "⧗";
    const decoration = enabled ? chalk.gray(sign) : sign;
    const commitText = errors.length > 0 ? input : input.split("\n")[0];

    const decoratedInput = enabled ? chalk.bold(commitText) : commitText;
    const hasProblems = errors.length > 0 || warnings.length > 0;

    return options.verbose || hasProblems
        ? [`${decoration}   input: ${decoratedInput}`]
        : [];
}

export function formatResult(
    result: FormattableResult,
    options: FormatOptions = {}
): string[] {
    const {
        signs = DEFAULT_SIGNS,
        colors = DEFAULT_COLORS,
        color: enabled = true,
    } = options;
    const { errors = [], warnings = [] } = result;

    const problems = [...errors, ...warnings].map((problem) => {
        const sign = signs[problem.level] || "";
        const color: ChalkColor = colors[problem.level] || ("white" as const);
        const decoration = enabled ? chalk[color](sign) : sign;
        const name = enabled ? chalk.grey(`[${problem.name}]`) : `[${problem.name}]`;
        return `${decoration}   ${problem.message} ${name}`;
    });

    const sign = selectSign(result);
    const color = selectColor(result);

    const deco = enabled ? chalk[color](sign) : sign;
    const el = errors.length;
    const wl = warnings.length;
    const hasProblems = problems.length > 0;

    const summary =
        options.verbose || hasProblems
            ? `${deco}   found ${el} problems, ${wl} warnings`
            : undefined;

    const fmtSummary =
        enabled && typeof summary === "string" ? chalk.bold(summary) : summary;

    const help = hasProblems ? `ⓘ   Get help: ${options.helpUrl}` : undefined;

    return [
        ...problems,
        hasProblems ? "" : undefined,
        fmtSummary,
        help,
        help ? "" : undefined,
        result.url,
        "",
    ].filter((line): line is string => typeof line === "string");
}

function selectSign(result: FormattableResult): string {
    if ((result.errors || []).length > 0) {
        return "✖";
    }
    return (result.warnings || []).length ? "⚠" : "✔";
}

function selectColor(result: FormattableResult): ChalkColor {
    if ((result.errors || []).length > 0) {
        return "red";
    }
    return (result.warnings || []).length ? "yellow" : "green";
}
