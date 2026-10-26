# no-mistakes coding agent

> Stop telling your agent to "make no mistakes." Now it's built-in.

The `no-mistakes` coding agent is a minimal, extensible terminal agent with interactive, print, JSON, and RPC modes. Extend it with TypeScript extensions, skills, prompt templates, themes, and packages.

## Install

Install the CLI from npm:

```bash
npm install -g --ignore-scripts @no-mistakes/coding-agent
```

Node.js 22.19 or newer is required. The package installs the `no-mistakes` command and does not require dependency lifecycle scripts for a normal installation.

Standalone macOS, Linux, and Windows binaries are also published as GitHub Release assets.

## Sign in

```bash
no-mistakes auth login
no-mistakes auth login anthropic
```

The command prompts for the provider and authentication method, handles OAuth URLs, device codes, and manual codes, and saves credentials to `~/.no-mistakes/agent/auth.json`. You do not need to export environment variables.

Existing provider environment variables such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `GEMINI_API_KEY` are also supported. Use `no-mistakes auth --help` for login and credential-check commands.

## Run

```bash
cd /path/to/project
no-mistakes
```

Then enter a task, or run one task and exit:

```bash
no-mistakes -p "Fix the failing test"
```

Use `no-mistakes --help` for quick-start examples, authentication and provider setup, and core options grouped by models, execution, sessions, tools, and resources. Select a model with `--model`, continue the previous session with `--continue`, or resume a specific session with `--session <path|id>`.

Global configuration is stored under `~/.no-mistakes/`. Project-local extensions, skills, prompts, and themes belong under `.no-mistakes/` in the repository. Application-owned environment variables use the `NO_MISTAKES_` prefix; legacy `.pi` directories and `PI_*` aliases are not supported.

## Extend

- [Extensions](docs/extensions.md)
- [Skills](docs/skills.md)
- [Prompt templates](docs/prompt-templates.md)
- [Themes](docs/themes.md)
- [Packages](docs/packages.md)
- [TypeScript SDK](docs/sdk.md)
- [RPC integration](docs/rpc.md)

## Development

From the repository root:

```bash
npm install --ignore-scripts
npm run build
npm run check
./test.sh
```

Read [CONTRIBUTING.md](https://github.com/meedoomostafa/no-mistakes/blob/main/CONTRIBUTING.md) before opening an issue or pull request.

## License

MIT. See [LICENSE](../../LICENSE).
