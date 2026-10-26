import { formatUserAgent } from "@no-mistakes/ai";

/** no-mistakes' `User-Agent` for its own network requests. */
export function getNoMistakesUserAgent(version: string): string {
	return formatUserAgent({ userAgent: "detailed", version });
}

/**
 * The pi.dev model-catalog service still identifies compatible Pi clients by
 * their Pi product token. Other requests use the no-mistakes user agent.
 */
export function getPiCatalogUserAgent(version: string): string {
	const runtime = process.versions.bun ? `bun/${process.versions.bun}` : `node/${process.version}`;
	return `pi/${version} (${process.platform}; ${runtime}; ${process.arch})`;
}
