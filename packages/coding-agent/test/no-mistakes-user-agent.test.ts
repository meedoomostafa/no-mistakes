import { describe, expect, it } from "vitest";
import { getNoMistakesUserAgent, getPiCatalogUserAgent } from "../src/utils/no-mistakes-user-agent.ts";

describe("getNoMistakesUserAgent", () => {
	it("formats the no-mistakes detailed user agent", () => {
		const runtime = process.versions.bun ? `bun/${process.versions.bun}` : `node/${process.version}`;
		const userAgent = getNoMistakesUserAgent("1.2.3");

		expect(userAgent).toBe(`no-mistakes/1.2.3 (${process.platform}; ${runtime}; ${process.arch})`);
		expect(userAgent).toMatch(/^no-mistakes\/[^\s()]+ \([^;()]+;\s*[^;()]+;\s*[^()]+\)$/);
	});
});

describe("getPiCatalogUserAgent", () => {
	it("preserves the catalog service's Pi product token", () => {
		const runtime = process.versions.bun ? `bun/${process.versions.bun}` : `node/${process.version}`;

		expect(getPiCatalogUserAgent("1.2.3")).toBe(`pi/1.2.3 (${process.platform}; ${runtime}; ${process.arch})`);
	});
});
