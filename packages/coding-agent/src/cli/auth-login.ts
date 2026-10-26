import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import type {
	ApiKeyCredential,
	AuthEvent,
	AuthInteraction,
	AuthPrompt,
	AuthType,
	Credential,
	LoginOptions,
	OAuthCredential,
	ProviderAuthInteraction,
} from "@no-mistakes/ai";
import { getAgentDir, getAuthPath } from "../config.ts";
import { ModelRuntime } from "../core/model-runtime.ts";
import { SettingsManager } from "../core/settings-manager.ts";
import { openBrowser } from "../utils/open-browser.ts";

export interface AuthLoginProvider {
	id: string;
	name: string;
	auth: {
		apiKey?: {
			name: string;
			login?: (interaction: ProviderAuthInteraction, options?: LoginOptions) => Promise<ApiKeyCredential>;
		};
		oauth?: {
			name: string;
			loginLabel?: string;
			login: (interaction: ProviderAuthInteraction, options?: LoginOptions) => Promise<OAuthCredential>;
		};
	};
}

export interface AuthLoginRuntime {
	getProviders(): readonly AuthLoginProvider[];
	login(providerId: string, type: AuthType, interaction: AuthInteraction, options?: LoginOptions): Promise<Credential>;
}

export interface AuthLoginResult {
	provider: AuthLoginProvider;
	type: AuthType;
	credential: Credential;
}

interface LoginMethod {
	type: AuthType;
	label: string;
	description?: string;
}

function loginMethods(provider: AuthLoginProvider): LoginMethod[] {
	const methods: LoginMethod[] = [];
	if (provider.auth.oauth) {
		methods.push({
			type: "oauth",
			label: provider.auth.oauth.loginLabel ?? `Sign in with ${provider.name}`,
			description: provider.auth.oauth.name,
		});
	}
	if (provider.auth.apiKey?.login) {
		methods.push({
			type: "api_key",
			label: `Use an API key for ${provider.name}`,
			description: provider.auth.apiKey.name,
		});
	}
	return methods;
}

function resolveProvider(providers: readonly AuthLoginProvider[], requestedProvider: string): AuthLoginProvider {
	const normalized = requestedProvider.trim().toLowerCase();
	const exact = providers.filter((provider) => provider.id.toLowerCase() === normalized);
	if (exact.length === 1) return exact[0]!;

	const named = providers.filter((provider) => provider.name.toLowerCase() === normalized);
	if (named.length === 1) return named[0]!;
	if (named.length > 1) {
		throw new Error(
			`Provider name "${requestedProvider}" is ambiguous. Use one of: ${named.map((p) => p.id).join(", ")}`,
		);
	}

	throw new Error(
		`Unknown provider "${requestedProvider}". Available login providers: ${providers.map((provider) => provider.id).join(", ")}`,
	);
}

async function selectProvider(
	providers: readonly AuthLoginProvider[],
	interaction: AuthInteraction,
): Promise<AuthLoginProvider> {
	const selectedId = await interaction.prompt({
		type: "select",
		message: "Select a provider",
		options: providers.map((provider) => ({
			id: provider.id,
			label: provider.name,
			description: provider.id,
		})),
	});
	const provider = providers.find((entry) => entry.id === selectedId);
	if (!provider) throw new Error("Login cancelled");
	return provider;
}

async function selectMethod(
	provider: AuthLoginProvider,
	methods: readonly LoginMethod[],
	interaction: AuthInteraction,
): Promise<LoginMethod> {
	if (methods.length === 1) return methods[0]!;
	const selectedId = await interaction.prompt({
		type: "select",
		message: `Select an authentication method for ${provider.name}`,
		options: methods.map((method) => ({
			id: method.type,
			label: method.label,
			...(method.description ? { description: method.description } : {}),
		})),
	});
	const method = methods.find((entry) => entry.type === selectedId);
	if (!method) throw new Error("Login cancelled");
	return method;
}

/** Select a provider and authentication method, then delegate the flow to ModelRuntime. */
export async function executeAuthLogin(
	runtime: AuthLoginRuntime,
	interaction: AuthInteraction,
	requestedProvider?: string,
	options?: LoginOptions,
): Promise<AuthLoginResult> {
	const providers = runtime.getProviders().filter((provider) => loginMethods(provider).length > 0);
	if (providers.length === 0) throw new Error("No providers support interactive login");

	const provider = requestedProvider?.trim()
		? resolveProvider(providers, requestedProvider)
		: await selectProvider(providers, interaction);
	const method = await selectMethod(provider, loginMethods(provider), interaction);
	const credential = await runtime.login(provider.id, method.type, interaction, options);
	return { provider, type: method.type, credential };
}

type TerminalInput = NodeJS.ReadableStream & {
	isTTY?: boolean;
	setRawMode?: (mode: boolean) => unknown;
};

type TerminalOutput = NodeJS.WritableStream;

/** Terminal-backed AuthInteraction. Secret answers are never written to the output stream. */
export class TerminalAuthInteraction implements AuthInteraction {
	readonly signal: AbortSignal;
	private readonly abortController = new AbortController();
	private readonly input: TerminalInput;
	private readonly output: TerminalOutput;

	constructor(input: TerminalInput = process.stdin, output: TerminalOutput = process.stdout, signal?: AbortSignal) {
		this.input = input;
		this.output = output;
		this.signal = signal ? AbortSignal.any([signal, this.abortController.signal]) : this.abortController.signal;
	}

	prompt = async (prompt: AuthPrompt): Promise<string> => {
		this.signal.throwIfAborted();
		prompt.signal?.throwIfAborted();

		if (prompt.type === "select") {
			this.output.write(`\n${prompt.message}\n`);
			for (const [index, option] of prompt.options.entries()) {
				this.output.write(`  ${index + 1}. ${option.label}\n`);
				if (option.description) this.output.write(`     ${option.description}\n`);
			}
			const answer = await this.readLine(`Enter number (1-${prompt.options.length}): `, prompt.signal);
			const selected = /^\d+$/.test(answer.trim()) ? prompt.options[Number(answer.trim()) - 1] : undefined;
			if (!selected) throw new Error("Invalid selection");
			return selected.id;
		}

		if (prompt.type === "secret") {
			this.output.write(`${prompt.message}: `);
			try {
				return await this.readLine("", prompt.signal, true);
			} finally {
				this.output.write("\n");
			}
		}

		const suffix = prompt.placeholder ? ` (${prompt.placeholder})` : "";
		return this.readLine(`${prompt.message}${suffix}: `, prompt.signal);
	};

	notify = (event: AuthEvent): void => {
		if (event.type === "auth_url") {
			this.output.write(`\nOpen this URL in your browser:\n${event.url}\n`);
			if (event.instructions) this.output.write(`${event.instructions}\n`);
			openBrowser(event.url);
			return;
		}
		if (event.type === "device_code") {
			this.output.write(`\nOpen this URL in your browser:\n${event.verificationUri}\n`);
			this.output.write(`Enter code: ${event.userCode}\n`);
			if (event.openBrowserOnConfirm !== false) openBrowser(event.verificationUri);
			return;
		}
		if (event.type === "info") {
			this.output.write(`\n${event.message}\n`);
			for (const link of event.links ?? []) {
				this.output.write(`${link.label ? `${link.label}: ` : ""}${link.url}\n`);
			}
			return;
		}
		this.output.write(`${event.message}\n`);
	};

	private readLine(query: string, promptSignal?: AbortSignal, secret = false): Promise<string> {
		const mutedOutput = new Writable({
			write(_chunk, _encoding, callback) {
				callback();
			},
		});
		const rl = createInterface({
			input: this.input,
			output: secret ? mutedOutput : this.output,
			terminal: this.input.isTTY === true,
		});

		return new Promise<string>((resolve, reject) => {
			let settled = false;
			const finish = (callback: () => void) => {
				if (settled) return;
				settled = true;
				this.signal.removeEventListener("abort", onAbort);
				promptSignal?.removeEventListener("abort", onPromptAbort);
				rl.removeListener("SIGINT", onCancel);
				rl.removeListener("close", onCancel);
				rl.close();
				callback();
			};
			const onAbort = () => finish(() => reject(this.signal.reason ?? new Error("Login cancelled")));
			const onPromptAbort = () => finish(() => reject(promptSignal?.reason ?? new Error("Login cancelled")));
			const onCancel = () => this.abortController.abort(new Error("Login cancelled"));
			this.signal.addEventListener("abort", onAbort, { once: true });
			promptSignal?.addEventListener("abort", onPromptAbort, { once: true });
			rl.once("SIGINT", onCancel);
			rl.once("close", onCancel);

			try {
				if (this.signal.aborted) return onAbort();
				if (promptSignal?.aborted) return onPromptAbort();
				rl.question(query, (answer) => finish(() => resolve(answer)));
			} catch (error) {
				finish(() => reject(error));
			}
		});
	}
}

/** Run the interactive terminal login flow using the application's locked credential store. */
export async function runAuthLogin(requestedProvider?: string): Promise<AuthLoginResult> {
	const controller = new AbortController();
	const onSigint = () => controller.abort(new Error("Login cancelled"));
	process.once("SIGINT", onSigint);

	try {
		const runtime = await ModelRuntime.create({
			allowModelNetwork: false,
			refreshOnCreate: false,
			signal: controller.signal,
		});
		const settings = SettingsManager.create(process.cwd(), getAgentDir(), { projectTrusted: false });
		const interaction = new TerminalAuthInteraction(process.stdin, process.stdout, controller.signal);
		return await executeAuthLogin(runtime, interaction, requestedProvider, {
			getDeviceId: () => settings.getOrCreateDeviceId(),
		});
	} finally {
		process.removeListener("SIGINT", onSigint);
	}
}

export function formatAuthLoginSuccess(result: AuthLoginResult): string {
	const action =
		result.type === "oauth" ? `Signed in to ${result.provider.name}` : `Saved API key for ${result.provider.name}`;
	return `${action}. Credentials saved to ${getAuthPath()}`;
}
