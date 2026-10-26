# no-mistakes

no-mistakes is an extensible AI agent that works from your terminal. Give it a goal and a working folder, and it can inspect files, run commands, edit content, and work through multi-step tasks.

Use no-mistakes for software development, research notes, writing projects, data files, or hobby work. You can use no-mistakes as is, prompt it to adapt itself to your workflow, or build other applications powered by no-mistakes using the SDK.

## Start using no-mistakes

New to no-mistakes? Follow the [Quickstart](quickstart.md) to install no-mistakes, connect a model, and complete your first task.

If no-mistakes is already installed, choose what you want to do:

- [Use no-mistakes interactively](usage.md) to add files, run commands, direct ongoing work, and export results.
- [Choose a model](models.md) or connect a subscription, API key, local model, or compatible endpoint.
- [Continue or branch a session](sessions.md) to resume work or explore another approach without losing history.
- [Configure no-mistakes](configuration.md) for your preferences, working folders, instructions, and reusable resources.
- [Understand how no-mistakes works](how-no-mistakes-works.md), including tools, context, sessions, and the agent loop.

## Customize no-mistakes

no-mistakes can reuse prompts, load specialized instructions, add executable integrations, change its terminal interface, connect model services, and distribute these resources as packages.
Use the [Quickstart customization chooser](quickstart.md#choose-how-to-customize-no-mistakes) to select the smallest mechanism that meets your need.

## Automate or embed no-mistakes

- Use [print mode](cli.md#invocation-and-output) for one-off and scripted tasks.
- Use [JSON event stream mode](json.md) to consume structured events from one run.
- Use [RPC mode](rpc.md) to control a separate no-mistakes process.
- Use the [TypeScript SDK](sdk.md) to run no-mistakes inside an application.

## Find reference and setup information

Use the reference pages to look up [CLI options](cli.md), [settings](settings.md), [providers](providers.md), [keybindings](keybindings.md), and [environment variables](environment-variables.md).

For platform-specific help, see [Terminal Setup](terminal-setup.md), [Windows](windows.md), [tmux](tmux.md), [Termux on Android](termux.md), or [Containerization](containerization.md).

## Work safely

The tools and extensions run with the permissions of the no-mistakes process. Project trust controls which project resources no-mistakes loads, but it does not sandbox tool calls. Review [Security](security.md) before using untrusted files, repositories, extensions, or unattended automation.
