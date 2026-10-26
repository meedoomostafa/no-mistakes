# no-mistakes

> Stop telling your agent to "make no mistakes." Now it's built-in.

`no-mistakes` is a minimal, extensible coding-agent harness. It runs interactively in a terminal, supports print and JSON modes for automation, exposes an RPC mode for integrations, and can be extended with TypeScript extensions, skills, prompt templates, themes, and packages.

## Install

### npm

Node.js 22.19 or newer is required.

```bash
npm install -g --ignore-scripts @no-mistakes/coding-agent
```

The package installs the `no-mistakes` command. A normal npm installation does not require dependency lifecycle scripts.

### GitHub Releases

Standalone binaries are published as GitHub Release assets. Download the asset for your platform, make it executable, and place it on your `PATH`.

```bash
no-mistakes --version
```

## Sign in

Connect a supported provider account:

```bash
no-mistakes auth login
```

Select a provider when prompted, or name one directly:

```bash
no-mistakes auth login anthropic
```

Login saves credentials to `~/.no-mistakes/agent/auth.json`; you do not need to export environment variables. Existing provider environment variables such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `GEMINI_API_KEY` are also supported.

## Use

Run the agent in your project:

```bash
cd /path/to/project
no-mistakes
```

Useful non-interactive forms:

```bash
no-mistakes -p "Explain this repository"
no-mistakes --mode json -p "Summarize the current changes"
```

Run `no-mistakes --help` for quick-start examples, authentication and provider setup, and core options grouped by models, execution, sessions, tools, and resources. For example:

```bash
no-mistakes --model anthropic/claude-sonnet --continue
no-mistakes auth --help
```

The [coding-agent documentation](packages/coding-agent/docs/index.md) covers configuration, extensions, SDK usage, RPC, and packaging.

## Configuration

- Global configuration and credentials live under `~/.no-mistakes/`.
- Project-local resources live under `.no-mistakes/` in the repository.
- Application-owned environment variables use the `NO_MISTAKES_` prefix, including `NO_MISTAKES_CODING_AGENT_DIR` and `NO_MISTAKES_CODING_AGENT_SESSION_DIR`.
- Provider-owned environment variables retain their provider names, such as `OPENAI_API_KEY`.

Legacy `.pi` directories and `PI_*` application environment variables are not read.

## Packages

This monorepo publishes the no-mistakes workspace packages:

| Package | Description |
|---------|-------------|
| **[@no-mistakes/agent-core](packages/agent)** | Agent runtime with tool calling, state management, and transport abstractions |
| **[@no-mistakes/ai](packages/ai)** | Unified multi-provider LLM API with model discovery and authentication |
| **[@no-mistakes/tui](packages/tui)** | Terminal UI library with differential rendering |
| **[@no-mistakes/coding-agent](packages/coding-agent)** | Interactive coding-agent CLI and SDK |
| **[@no-mistakes/codemode](packages/codemode)** | Sandboxed JavaScript execution for injected tools |
| **[@no-mistakes/durable](packages/durable)** | Durable conversation, task, and document runtime |
| **[@no-mistakes/env](packages/env)** | Remote execution environment daemon and client |
| **[@no-mistakes/evals](packages/evals)** | Evaluation harness and reports |
| **[@no-mistakes/mcp](packages/mcp)** | Model Context Protocol client and OAuth support |
| **[@no-mistakes/telemetry](packages/telemetry)** | Vendor-neutral telemetry contracts and typed schemas |
| **[@no-mistakes/chord](packages/chord)** | Typed host runtime for plugins, contracts, state, and RPC |
| **@no-mistakes/coding-agent-install** | Lockfile package used for reproducible coding-agent installations |

## Security and permissions

`no-mistakes` does not enforce a built-in permission sandbox. It runs with the filesystem, process, network, and credential access of the user who started it. Use the [containerization guidance](packages/coding-agent/docs/containerization.md) when stronger isolation is required.

## Development

```bash
npm install --ignore-scripts
npm run build
npm run check
./test.sh
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution requirements and [AGENTS.md](AGENTS.md) for repository-specific development rules.

## License

MIT. See [LICENSE](LICENSE).
