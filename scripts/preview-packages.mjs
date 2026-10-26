#!/usr/bin/env node
// CI uploads this coherent package set as a GitHub Actions artifact. Install it with
// use-local-packages.mjs so every workspace dependency resolves from the same build.

import { parseArgs } from "node:util";
import { produceArtifactSet } from "./package-artifacts.mjs";

try {
	const [command, ...args] = process.argv.slice(2);
	if (command !== "pack") throw new Error("Usage: node scripts/preview-packages.mjs pack --sha <sha> --out <dir>");
	const { values } = parseArgs({
		args,
		options: { sha: { type: "string" }, out: { type: "string" } },
	});
	if (!/^[0-9a-f]{40}$/.test(values.sha ?? "")) throw new Error("--sha must be a full commit SHA");
	if (!values.out) throw new Error("--out is required");
	const artifactSet = produceArtifactSet({
		repoRoot: process.cwd(),
		outDir: values.out,
		build: false,
		source: { commit: values.sha },
		// Only the release workflow cross-compiles the daemons that this package ships.
		excludePackages: ["@no-mistakes/env"],
	});
	console.log(`Preview package manifest: ${artifactSet.manifestPath}`);
} catch (error) {
	console.error(`preview-packages: ${error.message}`);
	process.exitCode = 1;
}
