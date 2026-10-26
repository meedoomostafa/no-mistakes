import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("resolves workspace source entrypoints without built declarations", () => {
	const output = execFileSync(
		process.execPath,
		[
			"--conditions=source",
			"--input-type=module",
			"--eval",
			'console.log(import.meta.resolve("@no-mistakes/telemetry")); console.log(import.meta.resolve("@no-mistakes/telemetry/testing"));',
		],
		{ cwd: fileURLToPath(new URL("..", import.meta.url)), encoding: "utf8" },
	);
	expect(output.trim().split(/\r?\n/)).toEqual([
		new URL("../src/index.ts", import.meta.url).href,
		new URL("../src/testing/index.ts", import.meta.url).href,
	]);
});
