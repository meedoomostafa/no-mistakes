import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { installConsumer, smokeTestNpmConsumer } from "./local-package-install.mjs";
import { readArtifactSet } from "./package-artifacts.mjs";

const script = fileURLToPath(new URL("./preview-packages.mjs", import.meta.url));
const sha = "a".repeat(40);

test("preview artifacts remain installable together after downloading elsewhere", (t) => {
	const root = mkdtempSync(join(tmpdir(), "no-mistakes-preview-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const repo = join(root, "repo");
	const manifests = [
		{ name: "@preview/a", version: "1.0.0", dependencies: { "@preview/b": "1.0.0" } },
		{ name: "@preview/b", version: "1.0.0" },
		{ name: "@preview/internal", version: "1.0.0", private: true },
		{ name: "@no-mistakes/env", version: "1.0.0" },
	];
	for (const manifest of manifests) {
		const directory = join(repo, "packages", manifest.name.split("/")[1]);
		mkdirSync(directory, { recursive: true });
		writeFileSync(join(directory, "package.json"), JSON.stringify({
			...manifest, type: "module", main: "./index.js", types: "./index.d.ts",
		}));
		writeFileSync(join(directory, "index.js"), manifest.name === "@preview/a"
			? 'export { marker } from "@preview/b";\n'
			: 'export const marker = "preview";\n');
		writeFileSync(join(directory, "index.d.ts"), "export declare const marker: string;\n");
	}
	const manifestPath = join(repo, "packages/a/package.json");
	const original = readFileSync(manifestPath, "utf8");
	const out = join(root, "packed");
	execFileSync(process.execPath, [script, "pack", "--sha", sha, "--out", out], { cwd: repo });
	assert.equal(readFileSync(manifestPath, "utf8"), original);

	const downloaded = join(root, "downloaded with spaces");
	renameSync(out, downloaded);
	const artifactSet = readArtifactSet(join(downloaded, "manifest.json"));
	assert.equal(artifactSet.source.commit, sha);
	assert.deepEqual(artifactSet.packages.map((pkg) => pkg.name), ["@preview/a", "@preview/b"]);
	const consumer = join(root, "consumer");
	installConsumer({ artifactSet, directory: consumer, packageNames: ["@preview/a"] });
	smokeTestNpmConsumer({ artifactSet, directory: consumer, packageName: "@preview/a" });
	assert.doesNotMatch(readFileSync(join(consumer, "package-lock.json"), "utf8"), /https?:\/\//);
});

test("rejects a non-commit preview identity before packing", () => {
	assert.throws(
		() => execFileSync(process.execPath, [script, "pack", "--sha", "main", "--out", "unused"], { stdio: "pipe" }),
		/--sha must be a full commit SHA/,
	);
});
