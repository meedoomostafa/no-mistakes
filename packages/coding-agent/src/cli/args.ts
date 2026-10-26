/**
 * CLI argument parsing and help display
 */

import type { ThinkingLevel } from "@no-mistakes/agent-core";
import chalk from "chalk";
import { APP_NAME, CONFIG_DIR_NAME, ENV_AGENT_DIR, ENV_SESSION_DIR } from "../config.ts";
import type { ExtensionFlag } from "../core/extensions/types.ts";
import { getToolListError, type TuiMode } from "../core/settings-manager.ts";

export type Mode = "text" | "json" | "rpc";

export interface Args {
	provider?: string;
	model?: string;
	apiKey?: string;
	systemPrompt?: string;
	appendSystemPrompt?: string[];
	thinking?: ThinkingLevel;
	continue?: boolean;
	resume?: boolean;
	help?: boolean;
	version?: boolean;
	mode?: Mode;
	name?: string;
	noSession?: boolean;
	session?: string;
	sessionId?: string;
	fork?: string;
	sessionDir?: string;
	models?: string[];
	tools?: string[];
	excludeTools?: string[];
	noTools?: boolean;
	noBuiltinTools?: boolean;
	extensions?: string[];
	noExtensions?: boolean;
	noMcp?: boolean;
	print?: boolean;
	export?: string;
	noSkills?: boolean;
	skills?: string[];
	promptTemplates?: string[];
	noPromptTemplates?: boolean;
	themes?: string[];
	useTheme?: string;
	noThemes?: boolean;
	noContextFiles?: boolean;
	listModels?: string | true;
	offline?: boolean;
	tuiMode?: TuiMode;
	verbose?: boolean;
	projectTrustOverride?: boolean;
	messages: string[];
	fileArgs: string[];
	/** Unknown flags (potentially extension flags) - map of flag name to value */
	unknownFlags: Map<string, boolean | string>;
	diagnostics: Array<{ type: "warning" | "error"; message: string }>;
}

const VALID_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

export function isValidThinkingLevel(level: string): level is ThinkingLevel {
	return VALID_THINKING_LEVELS.includes(level as ThinkingLevel);
}

export function normalizeSessionName(value: string): string | undefined {
	const name = value.trim();
	return name.length > 0 ? name : undefined;
}

export function parseArgs(args: string[]): Args {
	const result: Args = {
		messages: [],
		fileArgs: [],
		unknownFlags: new Map(),
		diagnostics: [],
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--") {
			for (const positionalArg of args.slice(i + 1)) {
				if (positionalArg.startsWith("@")) {
					result.fileArgs.push(positionalArg.slice(1));
				} else {
					result.messages.push(positionalArg);
				}
			}
			break;
		} else if (arg === "--help" || arg === "-h") {
			result.help = true;
		} else if (arg === "--version" || arg === "-v") {
			result.version = true;
		} else if (arg === "--mode") {
			const mode = args[i + 1];
			if (mode === undefined || mode.startsWith("-")) {
				result.diagnostics.push({ type: "error", message: "--mode requires text, json, or rpc" });
				continue;
			}
			i++;
			if (mode !== "text" && mode !== "json" && mode !== "rpc") {
				result.diagnostics.push({
					type: "error",
					message: `Invalid mode "${mode}". Valid values: text, json, rpc`,
				});
				continue;
			}
			result.mode = mode;
		} else if (arg === "--continue" || arg === "-c") {
			result.continue = true;
		} else if (arg === "--resume" || arg === "-r") {
			result.resume = true;
		} else if (arg === "--provider" && i + 1 < args.length) {
			result.provider = args[++i];
		} else if (arg === "--model" && i + 1 < args.length) {
			result.model = args[++i];
		} else if (arg === "--api-key" && i + 1 < args.length) {
			result.apiKey = args[++i];
		} else if (arg === "--system-prompt" && i + 1 < args.length) {
			result.systemPrompt = args[++i];
		} else if (arg === "--append-system-prompt" && i + 1 < args.length) {
			result.appendSystemPrompt = result.appendSystemPrompt ?? [];
			result.appendSystemPrompt.push(args[++i]);
		} else if (arg === "--name" || arg === "-n") {
			if (i + 1 < args.length) {
				result.name = args[++i];
			} else {
				result.diagnostics.push({ type: "error", message: "--name requires a value" });
			}
		} else if (arg === "--no-session") {
			result.noSession = true;
		} else if (arg === "--session" && i + 1 < args.length) {
			result.session = args[++i];
		} else if (arg === "--session-id" && i + 1 < args.length) {
			result.sessionId = args[++i];
		} else if (arg === "--fork" && i + 1 < args.length) {
			result.fork = args[++i];
		} else if (arg === "--session-dir" && i + 1 < args.length) {
			result.sessionDir = args[++i];
		} else if (arg === "--models" && i + 1 < args.length) {
			result.models = args[++i]
				.split(",")
				.map((s) => s.trim())
				.filter((pattern) => pattern.length > 0);
		} else if (arg === "--no-tools" || arg === "-nt") {
			result.noTools = true;
		} else if (arg === "--no-builtin-tools" || arg === "-nbt") {
			result.noBuiltinTools = true;
		} else if ((arg === "--tools" || arg === "-t") && i + 1 < args.length) {
			const tools = args[++i]
				.split(",")
				.map((s) => s.trim())
				.filter((name) => name.length > 0);
			const error = getToolListError(tools);
			if (error) {
				result.diagnostics.push({ type: "error", message: `${arg}: ${error}` });
			} else {
				result.tools = tools;
			}
		} else if ((arg === "--exclude-tools" || arg === "-xt") && i + 1 < args.length) {
			result.excludeTools = args[++i]
				.split(",")
				.map((s) => s.trim())
				.filter((name) => name.length > 0);
		} else if (arg === "--thinking" && i + 1 < args.length) {
			const level = args[++i];
			if (isValidThinkingLevel(level)) {
				result.thinking = level;
			} else {
				result.diagnostics.push({
					type: "warning",
					message: `Invalid thinking level "${level}". Valid values: ${VALID_THINKING_LEVELS.join(", ")}`,
				});
			}
		} else if (arg === "--print" || arg === "-p") {
			result.print = true;
			const next = args[i + 1];
			if (next !== undefined && !next.startsWith("@") && (!next.startsWith("-") || next.startsWith("---"))) {
				result.messages.push(next);
				i++;
			}
		} else if (arg === "--export" && i + 1 < args.length) {
			result.export = args[++i];
		} else if ((arg === "--extension" || arg === "-e") && i + 1 < args.length) {
			result.extensions = result.extensions ?? [];
			result.extensions.push(args[++i]);
		} else if (arg === "--no-extensions" || arg === "-ne") {
			result.noExtensions = true;
		} else if (arg === "--no-mcp") {
			result.noMcp = true;
		} else if (arg === "--skill" && i + 1 < args.length) {
			result.skills = result.skills ?? [];
			result.skills.push(args[++i]);
		} else if (arg === "--prompt-template" && i + 1 < args.length) {
			result.promptTemplates = result.promptTemplates ?? [];
			result.promptTemplates.push(args[++i]);
		} else if (arg === "--theme" && i + 1 < args.length) {
			result.themes = result.themes ?? [];
			result.themes.push(args[++i]);
		} else if (arg === "--use-theme") {
			const themeName = args[i + 1];
			if (themeName === undefined || themeName.startsWith("-")) {
				result.diagnostics.push({ type: "error", message: "--use-theme requires a theme name" });
			} else {
				result.useTheme = themeName;
				i++;
			}
		} else if (arg === "--no-skills" || arg === "-ns") {
			result.noSkills = true;
		} else if (arg === "--no-prompt-templates" || arg === "-np") {
			result.noPromptTemplates = true;
		} else if (arg === "--no-themes") {
			result.noThemes = true;
		} else if (arg === "--no-context-files" || arg === "-nc") {
			result.noContextFiles = true;
		} else if (arg === "--list-models") {
			// Check if next arg is a search pattern (not a flag or file arg)
			if (i + 1 < args.length && !args[i + 1].startsWith("-") && !args[i + 1].startsWith("@")) {
				result.listModels = args[++i];
			} else {
				result.listModels = true;
			}
		} else if (arg === "--tui-mode") {
			const mode = args[i + 1];
			if (mode === "regular" || mode === "fullscreen") {
				result.tuiMode = mode;
				i++;
			} else if (mode === undefined || mode.startsWith("-")) {
				result.diagnostics.push({ type: "error", message: "--tui-mode requires regular or fullscreen" });
			} else {
				i++;
				result.diagnostics.push({
					type: "error",
					message: `Invalid TUI mode "${mode}". Valid values: regular, fullscreen`,
				});
			}
		} else if (arg === "--verbose") {
			result.verbose = true;
		} else if (arg === "--approve" || arg === "-a") {
			result.projectTrustOverride = true;
		} else if (arg === "--no-approve" || arg === "-na") {
			result.projectTrustOverride = false;
		} else if (arg === "--offline") {
			result.offline = true;
		} else if (arg.startsWith("@")) {
			result.fileArgs.push(arg.slice(1)); // Remove @ prefix
		} else if (arg.startsWith("--")) {
			const eqIndex = arg.indexOf("=");
			if (eqIndex !== -1) {
				result.unknownFlags.set(arg.slice(2, eqIndex), arg.slice(eqIndex + 1));
			} else {
				const flagName = arg.slice(2);
				const next = args[i + 1];
				if (next !== undefined && !next.startsWith("-") && !next.startsWith("@")) {
					result.unknownFlags.set(flagName, next);
					i++;
				} else {
					result.unknownFlags.set(flagName, true);
				}
			}
		} else if (arg.startsWith("-") && !arg.startsWith("--")) {
			result.diagnostics.push({ type: "error", message: `Unknown option: ${arg}` });
		} else if (!arg.startsWith("-")) {
			result.messages.push(arg);
		}
	}

	return result;
}

export function printHelp(extensionFlags?: ExtensionFlag[]): void {
	const extensionFlagsText =
		extensionFlags && extensionFlags.length > 0
			? `\n${chalk.bold("Extension CLI Flags:")}\n${extensionFlags
					.map((flag) => {
						const value = flag.type === "string" ? " <value>" : "";
						const description = flag.description ?? `Registered by ${flag.extensionPath}`;
						return `  --${flag.name}${value}`.padEnd(30) + description;
					})
					.join("\n")}\n`
			: "";
	console.log(`${chalk.bold(APP_NAME)} — The self-contained coding agent. Stop telling your agent to "make no mistakes."

${chalk.bold("Usage:")}
  ${APP_NAME} [options] [--] [@files...] [messages...]

${chalk.bold("Quick start:")}
  ${APP_NAME.padEnd(42)}Start the interactive terminal UI
  ${`${APP_NAME} -p "Fix the failing test"`.padEnd(42)}Run one task, print the result, and exit
  ${`${APP_NAME} auth login`.padEnd(42)}Connect a provider interactively

${chalk.bold("Authentication & providers (auth):")}
  Run ${APP_NAME} auth login to choose a provider and sign in or enter an API key.
  Or choose one directly: ${APP_NAME} auth login anthropic
  Login saves credentials; you do not need to export environment variables.
  Saved credentials: ~/${CONFIG_DIR_NAME}/agent/auth.json (or set ${ENV_AGENT_DIR}).
  Existing provider environment variables are also supported.

${chalk.bold("Commands:")}
  ${APP_NAME} auth login [provider]     Sign in and store provider credentials
  ${APP_NAME} auth check               Check provider credential status
  ${APP_NAME} auth print-api-key       Print an API key for an external client
  ${APP_NAME} auth print-bearer-token  Print an OAuth bearer token for an external client
  ${APP_NAME} install <source> [-l]    Install an extension or package source
  ${APP_NAME} remove <source> [-l]     Remove an extension or package source
  ${APP_NAME} uninstall <source> [-l]  Alias for remove
  ${APP_NAME} update [source]          Update installed packages or refresh model catalogs
  ${APP_NAME} list                     List installed extensions and packages
  ${APP_NAME} config [-l]              Open the package resource selector
  ${APP_NAME} mcp <command>            Manage MCP servers
  ${APP_NAME} <command> --help         Show help for a command

${chalk.bold("Core options:")}
  ${chalk.bold("Model and output")}
  --provider <name>              Provider to search for --model (requires --model)
  --model <pattern>              Model pattern or ID (supports "provider/id" and optional ":<thinking>")
  --thinking <level>             Set thinking level: off, minimal, low, medium, high, xhigh, max
  --models <patterns>            Comma-separated model patterns for Ctrl+P cycling
  --mode <mode>                  Output mode: text (default), json, or rpc
  --print, -p                    Non-interactive mode: process the prompt and exit
  --list-models [search]         List available models with optional fuzzy search
  --export <file> [output]       Export a session file to HTML and exit

  ${chalk.bold("Sessions")}
  --continue, -c                 Continue the previous session
  --resume, -r                   Select a session to resume
  --session <path|id>            Use a specific session file or partial UUID
  --session-id <id>              Use an exact project session ID, creating it if missing
  --fork <path|id>               Fork a session file or partial UUID
  --session-dir <dir>            Directory for session storage and lookup
  --no-session                   Do not save the session (ephemeral)
  --name, -n <name>              Set the session display name

  ${chalk.bold("Tools and extensions")}
  --tools, -t <tools>            Comma-separated tool allowlist; supports * patterns
  --exclude-tools, -xt <tools>   Comma-separated tool denylist
  --no-tools, -nt                Disable all tools by default
  --no-builtin-tools, -nbt       Disable built-in tools but keep extension and custom tools
  --extension, -e <path>         Load an extension file or builtin:<name>
  --no-extensions, -ne           Disable extension discovery and built-in extensions
  --no-mcp                       Disable built-in MCP support

  ${chalk.bold("Resources")}
  --skill <path>                 Load a skill file or directory
  --no-skills, -ns               Disable skill discovery and loading
  --prompt-template <path>       Load a prompt template file or directory
  --no-prompt-templates, -np     Disable prompt template discovery and loading
  --theme <path>                 Load a theme file or directory
  --use-theme <name[/name]>      Set the initial interactive theme
  --no-themes                    Disable theme discovery and loading
  --no-context-files, -nc        Disable AGENTS.md and CLAUDE.md discovery and loading

  ${chalk.bold("Prompt and startup")}
  --api-key <key>                API key for this run (overrides saved credentials)
  --system-prompt <text>         Replace the default coding assistant system prompt
  --append-system-prompt <text>  Append text or file contents to the system prompt
  --verbose                      Force verbose startup
  --tui-mode <mode>              TUI mode: fullscreen (default) or regular
  --approve, -a                  Trust project-local files for this run
  --no-approve, -na              Ignore project-local files for this run
  --offline                      Disable startup network operations

  ${chalk.bold("General")}
  --                             End option parsing; treat remaining arguments as messages or files
  --help, -h                     Show this help
  --version, -v                  Show the version number

Extensions can register additional flags (for example, --plan from the plan-mode extension).${extensionFlagsText}

${chalk.bold("Provider credentials:")}
  Optional environment variables: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY,
  GROQ_API_KEY, MISTRAL_API_KEY, and OPENROUTER_API_KEY. Use auth login to save credentials instead.

${chalk.bold("Application environment variables:")}
  ${ENV_AGENT_DIR.padEnd(44)}Config directory (default: ~/${CONFIG_DIR_NAME}/agent)
  ${ENV_SESSION_DIR.padEnd(44)}Session storage directory (overridden by --session-dir)
  ${"NO_MISTAKES_PACKAGE_DIR".padEnd(44)}Override package directory (for Nix/Guix store paths)
  ${"NO_MISTAKES_OFFLINE".padEnd(44)}Disable startup network operations when set to 1/true/yes
  ${"NO_MISTAKES_SKIP_VERSION_CHECK".padEnd(44)}Disable GitHub Releases version checks
  ${"NO_MISTAKES_SHARE_VIEWER_URL".padEnd(44)}Base URL for /share

${chalk.bold("Built-in tool names:")}
  read       - Read file contents
  bash       - Execute bash commands
  powershell - Execute PowerShell commands on Windows
  edit       - Edit files with find/replace
  write      - Write files (creates/overwrites)
  grep       - Search file contents (read-only, off by default)
  find       - Find files by glob pattern (read-only, off by default)
  ls         - List directory contents (read-only, off by default)
`);
}
