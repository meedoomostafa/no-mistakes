# Environment Variables

no-mistakes uses environment variables in three ways:

- Variables such as `NO_MISTAKES_OFFLINE` configure the no-mistakes process.
- no-mistakes sets process markers so child processes can identify it as the launching agent.
- Commands run by the LLM-callable shell tools receive `NO_MISTAKES_*` variables describing the current session.

Provider API-key variables are documented separately in [Providers](providers.md#use-an-api-key-from-the-environment).

## Process Marker

The CLI and RPC entry points set two process markers:

- `AI_AGENT=no-mistakes` is a generic marker that lets tooling identify no-mistakes as the agent that launched the process.
- `NO_MISTAKES_CODING_AGENT=true` lets child processes detect that they run inside no-mistakes.

Child processes inherit both markers. They are not session-specific and are not set automatically when no-mistakes is embedded through the SDK.

## Shell Tool Session Environment

Commands run by the `bash` and `powershell` tools receive the current no-mistakes session state:

| Variable | Description |
|----------|-------------|
| `NO_MISTAKES_SESSION_ID` | Current session ID |
| `NO_MISTAKES_SESSION_FILE` | Absolute path to the current session JSONL file; unset for ephemeral sessions |
| `NO_MISTAKES_PROVIDER` | Currently selected model provider |
| `NO_MISTAKES_MODEL` | Currently selected model ID |
| `NO_MISTAKES_REASONING_LEVEL` | Current effective reasoning level: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max` |

The values are resolved when each command starts. Switching models or changing the reasoning level therefore affects the next shell command without restarting no-mistakes. `NO_MISTAKES_PROVIDER` and `NO_MISTAKES_MODEL` identify the selected no-mistakes model, not a different upstream model that a router may choose internally.

When asked which model or provider is running, inspect these variables instead of inferring the answer from the system prompt:

```bash
printf '%s/%s\n' "$NO_MISTAKES_PROVIDER" "$NO_MISTAKES_MODEL"
printf 'reasoning=%s session=%s\n' "$NO_MISTAKES_REASONING_LEVEL" "$NO_MISTAKES_SESSION_ID"
```

The session file can be inspected directly when the session is persistent:

```bash
if [ -n "$NO_MISTAKES_SESSION_FILE" ]; then
  tail -n 1 "$NO_MISTAKES_SESSION_FILE"
fi
```

These variables are injected into the LLM-callable `bash` and `powershell` tools. They are not injected into user-entered `!` or `!!` commands.

### Custom Shell Tools

Tools created with `createBashTool()` or `createPowerShellTool()` expose the session environment by default when registered with no-mistakes. Injection happens before `spawnHook`, so a hook receives the variables in `ctx.env`:

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

Disable session metadata independently of the spawn hook:

```typescript
const powershellTool = createPowerShellTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

When disabled, no-mistakes removes inherited values for these variables so nested no-mistakes processes do not expose stale parent-session metadata.

## no-mistakes Process Configuration

These variables are read by no-mistakes itself:

| Variable | Description |
|----------|-------------|
| `NO_MISTAKES_CODING_AGENT_DIR` | Override the config directory; default is `~/.no-mistakes/agent` |
| `NO_MISTAKES_CODING_AGENT_SESSION_DIR` | Override session storage; overridden by `--session-dir` |
| `NO_MISTAKES_PACKAGE_DIR` | Override the package directory, useful for Nix/Guix store paths |
| `NO_MISTAKES_OFFLINE` | Disable automatic network activity, including model catalog refreshes |
| `NO_MISTAKES_SKIP_VERSION_CHECK` | Disable the GitHub Releases latest-version request |
| `NO_MISTAKES_CODEMODE_MAX_WORKERS` | Maximum codemode workers alive at once across all sessions in the process; default `2`. Each worker's script may use up to 256 MB. Raise it when one process runs several sessions, such as in-process subagents. Further scripts wait for a free worker. See [Codemode](codemode.md) |
| `NO_MISTAKES_CACHE_RETENTION` | Set to `long` for extended provider prompt caching where supported |
| `NO_MISTAKES_SHARE_VIEWER_URL` | Override the base URL used by `/share` |
| `NO_MISTAKES_RADIUS_GATEWAY` | Override the Radius gateway origin used by `/bug` uploads |
| `NO_MISTAKES_CLEAR_ON_SHRINK` | Set to `1` to clear empty rows when rendered content shrinks; the `terminal.clearOnShrink` setting takes precedence. See [Settings](settings.md) |
| `NO_MISTAKES_HARDWARE_CURSOR` | Set to `1` to show the hardware cursor; see [Terminal setup](terminal-setup.md) |
| `NO_MISTAKES_CLIPBOARD_OSC52` | Set to `1` to also send copied text to the terminal with OSC 52 after the local clipboard write, as no-mistakes does over SSH. Use it when a remote client reaches no-mistakes without SSH variables, such as a multiplexer attached from another machine or a remote IDE daemon |
| `NO_MISTAKES_HYPERLINKS` | Override OSC 8 hyperlink detection with `1`, `0`, or `auto` |
| `NO_MISTAKES_PROGRAM_STATUS` | Override OSC 7501 program status detection: `1` always reports, `0` never reports; otherwise no-mistakes reports only after the terminal confirms support. See [Terminal setup](terminal-setup.md#program-status) |
| `NO_MISTAKES_IMAGE_PROTOCOL` | Override inline image detection with `kitty`, `iterm2`, `none`, or `auto` |
| `NO_MISTAKES_TRUE_COLOR` | Override truecolor detection with `1`, `0`, or `auto` |
| `NO_MISTAKES_TUI_ESC_TIMEOUT` | How long to wait after a lone ESC before treating it as Escape, in milliseconds; defaults to `100` over SSH and `10` otherwise. Increase if Alt-key input is misread as Escape |
| `VISUAL`, `EDITOR` | External editor fallback when `externalEditor` is unset |
| `HTTP_PROXY`, `HTTPS_PROXY` | Proxy outbound HTTP requests |

Provider credentials such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and provider-specific configuration are listed in [Providers](providers.md#use-an-api-key-from-the-environment).
