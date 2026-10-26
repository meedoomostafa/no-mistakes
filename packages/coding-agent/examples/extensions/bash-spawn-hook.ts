/**
 * Bash Spawn Hook Example
 *
 * Adjusts command, cwd, and env before execution.
 *
 * Usage:
 *   no-mistakes -e ./bash-spawn-hook.ts
 */

import type { ExtensionAPI } from "@no-mistakes/coding-agent";
import { createBashTool } from "@no-mistakes/coding-agent";

export default function (api: ExtensionAPI) {
	const cwd = process.cwd();

	const bashTool = createBashTool(cwd, {
		spawnHook: ({ command, cwd, env }) => ({
			command: `source ~/.profile\n${command}`,
			cwd,
			env: { ...env, NO_MISTAKES_SPAWN_HOOK: "1" },
		}),
	});

	api.registerTool({
		...bashTool,
		execute: async (id, params, signal, onUpdate, _ctx) => {
			return bashTool.execute(id, params, signal, onUpdate);
		},
	});
}
