---
name: release
description: Prepare, publish, verify, and recover no-mistakes releases. Use for release preparation, local release smoke tests, publishing, and failed release CI.
---

# Releasing no-mistakes

Run repository commands from the repo root (two directories above this skill), unless instructed otherwise.

**Lockstep versioning**: all packages share one version; every release updates all together. `patch` = fixes + additions, `minor` = breaking changes. No major releases.

1. **Update CHANGELOGs**: ask the user whether they ran the `/cl` prompt on the latest commit on `main`. If not, they must run `/cl` first to audit and update each package's `[Unreleased]` section before releasing.

2. **Local smoke test**: build an unpublished release and smoke test from outside the repo so it cannot resolve workspace files:
   ```bash
   npm run release:local -- --out /tmp/no-mistakes-local-release --force
   cd /tmp

   # Node package install smoke tests
   /tmp/no-mistakes-local-release/node/no-mistakes --help
   /tmp/no-mistakes-local-release/node/no-mistakes --version
   /tmp/no-mistakes-local-release/node/no-mistakes --list-models
   /tmp/no-mistakes-local-release/node/no-mistakes -p "Say exactly: ok"

   # Bun binary smoke tests
   /tmp/no-mistakes-local-release/bun/no-mistakes --help
   /tmp/no-mistakes-local-release/bun/no-mistakes --version
   /tmp/no-mistakes-local-release/bun/no-mistakes --list-models
   /tmp/no-mistakes-local-release/bun/no-mistakes -p "Say exactly: ok"
   ```

   Verify Node and Bun startup, model/account listing, and at least one real prompt with the intended default provider. The bare commands start interactive mode; run each in tmux, submit a prompt, and wait for the model reply before considering the interactive smoke test passed. Failures are release blockers unless the user explicitly accepts the risk.

3. **Tag and publish**: create an annotated `vX.Y.Z` tag at the release commit and push it. The tag triggers `.github/workflows/build-binaries.yml`, which builds and tests the binaries, publishes the public workspace packages to npm with trusted publishing, and publishes the GitHub Release. The GitHub Release is the version-check source used by no-mistakes. Do not call upstream release-announcement infrastructure.

4. **Verify publication**: confirm every public workspace package resolves at the exact release version on npm, the GitHub Release is public, and its `no-mistakes-*` binary assets are downloadable. Installation is through npm or GitHub Releases; no-mistakes does not replace an already installed npm package in place or manage its own installation.

5. **Build the Nix release**: the tag push also triggers `.github/workflows/nix.yml`, which builds the tagged flake on Linux and macOS and then fast-forwards the `stable` branch to the release commit. `nix run github:meedoomostafa/no-mistakes/stable` runs the latest release. If the Nix build fails, `stable` stays on the previous release; fix `main` and ship the fix in the next release.

6. **Recover a failed publication**: inspect the failed GitHub Actions run. Draft GitHub Releases are removed automatically when a required publication step fails. Re-run the failed workflow after correcting the cause. npm packages already published at the target version must not be overwritten; increment the version if their published contents need correction.
