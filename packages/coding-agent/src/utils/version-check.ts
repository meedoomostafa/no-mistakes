import { compare, valid } from "semver";
import { fetchWithRetry } from "./management-http.ts";
import { getNoMistakesUserAgent } from "./no-mistakes-user-agent.ts";

const LATEST_RELEASE_URL = "https://api.github.com/repos/meedoomostafa/no-mistakes/releases/latest";
const DEFAULT_VERSION_CHECK_TIMEOUT_MS = 10000;

export interface LatestRelease {
	version: string;
	note?: string;
	url?: string;
}

/** Include useful errno details hidden behind Node's generic "fetch failed" error. */
export function formatVersionCheckError(error: unknown): string {
	const rootMessage = error instanceof Error && error.message ? error.message : String(error);
	const cause = error instanceof Error ? error.cause : undefined;
	const causes = cause instanceof AggregateError ? cause.errors : cause === undefined ? [] : [cause];
	const codes = causes
		.map((value) =>
			typeof value === "object" && value !== null && "code" in value && typeof value.code === "string"
				? value.code
				: undefined,
		)
		.filter((code): code is string => code !== undefined);

	if (codes.length > 0) return `${rootMessage} (${[...new Set(codes)].join(", ")})`;
	const causeMessage = causes.find(
		(value): value is Error => value instanceof Error && Boolean(value.message),
	)?.message;
	return causeMessage ? `${rootMessage} (cause: ${causeMessage})` : rootMessage;
}

export function comparePackageVersions(leftVersion: string, rightVersion: string): number | undefined {
	const left = valid(leftVersion.trim());
	const right = valid(rightVersion.trim());
	if (!left || !right) {
		return undefined;
	}
	return compare(left, right);
}

export function isNewerPackageVersion(candidateVersion: string, currentVersion: string): boolean {
	const comparison = comparePackageVersions(candidateVersion, currentVersion);
	if (comparison !== undefined) {
		return comparison > 0;
	}
	return candidateVersion.trim() !== currentVersion.trim();
}

function parseReleaseVersion(tagName: string): string | undefined {
	const trimmed = tagName.trim();
	const candidate = trimmed.startsWith("v") ? trimmed.slice(1) : trimmed;
	return valid(candidate) ? candidate : undefined;
}

export async function getLatestRelease(
	currentVersion: string,
	options: { timeoutMs?: number; retry?: boolean } = {},
): Promise<LatestRelease | undefined> {
	if (process.env.NO_MISTAKES_OFFLINE) return undefined;

	const response = await fetchWithRetry(
		LATEST_RELEASE_URL,
		{
			headers: {
				"User-Agent": getNoMistakesUserAgent(currentVersion),
				accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
		},
		{
			maxRetries: options.retry ? 2 : 0,
			timeoutMs: options.timeoutMs ?? DEFAULT_VERSION_CHECK_TIMEOUT_MS,
		},
	);
	if (!response.ok) return undefined;

	const data = (await response.json()) as {
		body?: unknown;
		html_url?: unknown;
		tag_name?: unknown;
	};
	if (typeof data.tag_name !== "string") return undefined;
	const version = parseReleaseVersion(data.tag_name);
	if (!version) return undefined;

	const note = typeof data.body === "string" && data.body.trim() ? data.body.trim() : undefined;
	const url = typeof data.html_url === "string" && data.html_url.trim() ? data.html_url.trim() : undefined;
	return {
		version,
		...(note ? { note } : {}),
		...(url ? { url } : {}),
	};
}

export async function getLatestVersion(
	currentVersion: string,
	options: { timeoutMs?: number; retry?: boolean } = {},
): Promise<string | undefined> {
	return (await getLatestRelease(currentVersion, options))?.version;
}

export async function checkForNewVersion(currentVersion: string): Promise<LatestRelease | undefined> {
	if (process.env.NO_MISTAKES_SKIP_VERSION_CHECK) return undefined;

	try {
		const latestRelease = await getLatestRelease(currentVersion);
		if (latestRelease && isNewerPackageVersion(latestRelease.version, currentVersion)) {
			return latestRelease;
		}
		return undefined;
	} catch {
		return undefined;
	}
}
