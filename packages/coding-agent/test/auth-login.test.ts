import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import type { AuthInteraction, AuthPrompt, Credential } from "@no-mistakes/ai";
import { afterEach, describe, expect, it } from "vitest";
import { parseAuthCommand } from "../src/cli/auth-command.ts";
import {
	type AuthLoginProvider,
	type AuthLoginRuntime,
	executeAuthLogin,
	TerminalAuthInteraction,
} from "../src/cli/auth-login.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { ModelRuntime } from "../src/core/model-runtime.ts";

const temporaryDirectories: string[] = [];
afterEach(() => {
	for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function providerWithBothMethods(): AuthLoginProvider {
	return {
		id: "anthropic",
		name: "Anthropic",
		auth: {
			oauth: {
				name: "Anthropic account",
				login: async () => ({ type: "oauth", refresh: "refresh", access: "access", expires: 1 }),
			},
			apiKey: {
				name: "Anthropic API key",
				login: async () => ({ type: "api_key", key: "secret" }),
			},
		},
	};
}

function fakeRuntime(provider: AuthLoginProvider): {
	runtime: AuthLoginRuntime;
	calls: Array<{ providerId: string; type: string }>;
} {
	const calls: Array<{ providerId: string; type: string }> = [];
	return {
		calls,
		runtime: {
			getProviders: () => [provider],
			login: async (providerId, type): Promise<Credential> => {
				calls.push({ providerId, type });
				return { type: "api_key", key: "stored" };
			},
		},
	};
}

describe("auth login command", () => {
	it("parses an optional provider", () => {
		expect(parseAuthCommand(["auth", "login"])).toMatchObject({ kind: "login" });
		expect(parseAuthCommand(["auth", "login"])?.provider).toBeUndefined();
		expect(parseAuthCommand(["auth", "login", "anthropic"])).toMatchObject({
			kind: "login",
			provider: "anthropic",
		});
	});
});

describe("executeAuthLogin", () => {
	it("selects the authentication method for a named provider", async () => {
		const provider = providerWithBothMethods();
		const { runtime, calls } = fakeRuntime(provider);
		const prompts: AuthPrompt[] = [];
		const interaction: AuthInteraction = {
			prompt: async (prompt) => {
				prompts.push(prompt);
				return "oauth";
			},
			notify: () => {},
		};

		const result = await executeAuthLogin(runtime, interaction, "anthropic");

		expect(result.provider.id).toBe("anthropic");
		expect(result.type).toBe("oauth");
		expect(calls).toEqual([{ providerId: "anthropic", type: "oauth" }]);
		expect(prompts).toHaveLength(1);
		expect(prompts[0]).toMatchObject({ type: "select", message: "Select an authentication method for Anthropic" });
	});

	it("selects a provider when none is named", async () => {
		const provider = providerWithBothMethods();
		const { runtime, calls } = fakeRuntime(provider);
		const prompts: AuthPrompt[] = [];
		const interaction: AuthInteraction = {
			prompt: async (prompt) => {
				prompts.push(prompt);
				return prompt.message === "Select a provider" ? provider.id : "api_key";
			},
			notify: () => {},
		};

		const result = await executeAuthLogin(runtime, interaction);

		expect(result.type).toBe("api_key");
		expect(calls).toEqual([{ providerId: "anthropic", type: "api_key" }]);
		expect(prompts.map((prompt) => prompt.message)).toEqual([
			"Select a provider",
			"Select an authentication method for Anthropic",
		]);
	});
});

describe("TerminalAuthInteraction", () => {
	it("passes terminal callbacks through ModelRuntime and persists credentials", async () => {
		const directory = mkdtempSync(join(tmpdir(), "no-mistakes-auth-login-"));
		temporaryDirectories.push(directory);
		const authPath = join(directory, "auth.json");
		const runtime = await ModelRuntime.create({
			credentials: AuthStorage.create(authPath),
			modelsPath: null,
			allowModelNetwork: false,
			refreshOnCreate: false,
		});
		const input = new PassThrough();
		const output = new PassThrough();
		let rendered = "";
		output.on("data", (chunk: Buffer) => {
			rendered += chunk.toString();
			if (chunk.toString().endsWith(": ")) queueMicrotask(() => input.write("test-only-secret\n"));
		});
		const interaction = new TerminalAuthInteraction(input, output);

		await runtime.login("openai", "api_key", interaction);

		expect(JSON.parse(readFileSync(authPath, "utf8"))).toMatchObject({
			openai: { type: "api_key", key: "test-only-secret" },
		});
		if (process.platform !== "win32") expect(statSync(authPath).mode & 0o777).toBe(0o600);
		expect(rendered).not.toContain("test-only-secret");
	});

	it("cancels the login and restores raw mode on Ctrl+C", async () => {
		let raw = false;
		const input = Object.assign(new PassThrough(), {
			isTTY: true,
			setRawMode: (enabled: boolean) => {
				raw = enabled;
			},
		});
		const interaction = new TerminalAuthInteraction(input, new PassThrough());
		const answer = interaction.prompt({ type: "secret", message: "API key" });
		input.write("\x03");

		await expect(answer).rejects.toThrow("Login cancelled");
		expect(interaction.signal.aborted).toBe(true);
		expect(raw).toBe(false);
	}, 1000);

	it("rejects a prompt when input closes", async () => {
		const input = new PassThrough();
		const interaction = new TerminalAuthInteraction(input, new PassThrough());
		const answer = interaction.prompt({ type: "text", message: "Code" });
		input.end();
		await expect(answer).rejects.toThrow("Login cancelled");
	}, 1000);

	it("allows another prompt after an OAuth callback cancels a manual-code prompt", async () => {
		const input = new PassThrough();
		const interaction = new TerminalAuthInteraction(input, new PassThrough());
		const callback = new AbortController();
		const pending = interaction.prompt({ type: "manual_code", message: "Code", signal: callback.signal });
		callback.abort(new Error("Browser callback received"));
		await expect(pending).rejects.toThrow("Browser callback received");
		expect(interaction.signal.aborted).toBe(false);
		const next = interaction.prompt({ type: "text", message: "Continue" });
		input.write("yes\n");
		expect(await next).toBe("yes");
	});

	it("does not echo secret input", async () => {
		let input: PassThrough & { isTTY: boolean; setRawMode: (mode: boolean) => unknown };
		input = Object.assign(new PassThrough(), {
			isTTY: true,
			setRawMode: () => input,
		});
		const output = new PassThrough();
		let rendered = "";
		output.on("data", (chunk: Buffer | string) => {
			rendered += chunk.toString();
		});
		const interaction = new TerminalAuthInteraction(input, output);

		const answer = interaction.prompt({ type: "secret", message: "API key" });
		input.write("super-secret\n");

		expect(await answer).toBe("super-secret");
		expect(rendered).toContain("API key:");
		expect(rendered).not.toContain("super-secret");
	});
});
