import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./check-model-catalog-compat.mjs", import.meta.url));

function checkWithRegistryResponse(t, metadata, status) {
	const root = mkdtempSync(join(tmpdir(), "no-mistakes-catalog-compat-test-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const bin = join(root, "bin");
	mkdirSync(bin);
	writeFileSync(join(bin, "npm"), `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(JSON.stringify(metadata))});\nprocess.exitCode = ${status};\n`, { mode: 0o755 });
	return spawnSync(process.execPath, [script], {
		encoding: "utf8",
		env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ""}` },
	});
}

test("skips compatibility when the package has no published release", { skip: process.platform === "win32" }, (t) => {
	const result = checkWithRegistryResponse(t, { error: { code: "E404", summary: "Package not found" } }, 1);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Skipped:.*no published release/);
});

test("does not hide registry failures as unpublished packages", { skip: process.platform === "win32" }, (t) => {
	const result = checkWithRegistryResponse(t, { error: { code: "E401", summary: "Unauthorized" } }, 1);
	assert.equal(result.status, 1);
	assert.match(result.stderr, /E401/);
	assert.doesNotMatch(result.stdout, /Skipped:/);
});

test("still skips releases older than the minimum catalog version", { skip: process.platform === "win32" }, (t) => {
	const result = checkWithRegistryResponse(t, "0.0.1", 0);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /latest release 0\.0\.1 is older than/);
});
