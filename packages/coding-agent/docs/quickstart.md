# Quickstart

no-mistakes runs in your terminal and works with files on your machine. To use it, you need access to a model through a supported provider. This can be a subscription, an API key, or a local model.

For native Windows setup, read [Windows Setup](windows.md). For Android, read [Termux Setup](termux.md).

## 1. Install no-mistakes

Install the npm package with Node.js 22.19 or newer:

```bash
npm install -g --ignore-scripts @no-mistakes/coding-agent
```

no-mistakes does not require dependency lifecycle scripts for a normal npm installation.

Prebuilt binaries are also published on [GitHub Releases](https://github.com/meedoomostafa/no-mistakes/releases). Download the archive for your platform and run the `no-mistakes` executable.

With Nix on macOS or Linux, install the latest release from the no-mistakes flake. Nix builds no-mistakes from source:

```bash
nix profile add github:meedoomostafa/no-mistakes/stable
```

Older Nix versions use `nix profile install` instead. Update with `nix profile upgrade no-mistakes`; `no-mistakes update` cannot update a Nix installation. To pin a release, use a tag such as `github:meedoomostafa/no-mistakes/v1.0.0`.

Verify the installation:

```bash
no-mistakes --version
```

## 2. Start no-mistakes

Change to the folder you want no-mistakes to work with, then start it:

```bash
cd /path/to/folder
no-mistakes
```

The working folder helps no-mistakes discover relevant files, instructions, and configuration. no-mistakes also uses it to group saved sessions.

The interface shows your conversation, an editor for prompts and commands, and a footer with the current folder, model, and session status. See [Use no-mistakes in the terminal](usage.md) to learn how to add files, run commands, direct ongoing work, and manage results.

## 3. Choose a model

A **model** generates no-mistakes responses. A **provider** is the service or account no-mistakes uses to access that model.

Sign in with a provider account or API key:

```bash
no-mistakes auth login
```

You can also select a provider directly, for example `no-mistakes auth login anthropic`. Provider environment variables are detected automatically and do not need manual export. Run `/model` afterward if you want to select a different available model.

See [Choose a model and provider](models.md) for supported providers, environment-variable authentication, local models, and custom endpoints.

## 4. Give no-mistakes a task

no-mistakes shows each file read, search, command, and edit it performs. It does not ask before every tool call.

Enter a task that matches your work, for example:

```text
Summarize @meeting-notes.md and save the action items to action-items.md.
```

```text
Explain how this repository is structured and how to run its checks.
```

```text
Compare @previous.csv with @current.csv and summarize the important changes.
```

Type `@` in the editor to search for a file instead of entering its full path. When no-mistakes finishes, review its response and any changed files. Use version control or backups for important work. For untrusted or unattended work, use a container or another sandbox. See [Security](security.md).

## Continue later

no-mistakes saves sessions automatically. Exit no-mistakes, then resume the most recent session for the same working folder with:

```bash
no-mistakes --continue
```

Use `/resume` to choose another saved session. See [Continue or branch a session](sessions.md) for session naming, branching, compaction, export, and sharing.

## Next steps

- [Use no-mistakes interactively](usage.md) to learn input, commands, shortcuts, and queued messages.
- [Add instructions](configuration.md#context-files) that no-mistakes should follow whenever it works in a folder.
- [Choose a model and provider](models.md).

### Choose how to customize no-mistakes

Start with the least powerful mechanism that meets your need:

| Need | Start with |
|---|---|
| Give no-mistakes persistent instructions for a folder | [`AGENTS.md`](configuration.md#context-files) |
| Reuse a prompt from the `/` menu | [Prompt template](prompt-templates.md) |
| Add task-specific instructions and supporting files | [Skill](skills.md) |
| Add executable tools, commands, or event handlers | [Extension](extensions.md) |
| Build a custom terminal component | [Terminal UI](tui.md) |
| Connect an unsupported model service | [Custom provider](custom-provider.md) |
| Install or distribute several resources | [no-mistakes package](packages.md) |

## Uninstall no-mistakes

If you installed no-mistakes with npm, run:

```bash
npm uninstall -g @no-mistakes/coding-agent
```

If you installed no-mistakes with Nix, run:

```bash
nix profile remove no-mistakes
```

Neither method removes configuration, credentials, sessions, or installed no-mistakes packages from `~/.no-mistakes/agent/`.
