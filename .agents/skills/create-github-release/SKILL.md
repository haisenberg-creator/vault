---
name: create-github-release
description: Create a GitHub release build using GitHub CLI (gh). Use when the user asks to create a release on GitHub, cut a version release, publish release binaries, or ship a tag release.
---

Create and publish a versioned release on GitHub with build artifacts, interactive pre-flight checks, and release notes.

## Workflow

Follow these steps sequentially. Do not skip pre-flight checks or proceed to release creation without user confirmation.

### Step 1: Pre-flight & Stack Auto-Detection

1. Verify GitHub CLI (`gh`) authentication status:

   ```bash
   gh auth status
   ```

   If not authenticated, halt and inform the user to run `gh auth login`.

2. Inspect git working directory status:

   ```bash
   git status --porcelain
   ```

   If uncommitted changes exist, pause and ask the user whether to stash, commit, or proceed despite dirty working directory.

3. Auto-detect project tech stack and build configuration by searching root project files:
   - **Node.js**: `package.json` -> version from `version` field, build script `npm run build` (or `pnpm build` / `yarn build`), artifacts in `dist/` or `build/`.
   - **Rust**: `Cargo.toml` -> version from `[package].version`, build command `cargo build --release`, artifacts in `target/release/`.
   - **Go**: `go.mod` -> version from git tags, build command `go build`, artifacts binary file.
   - **Python**: `pyproject.toml` or `setup.py` -> build command `python -m build`, artifacts in `dist/`.
   - **Makefile**: `Makefile` -> check for `build` or `release` targets.

_Completion Criterion_: `gh` authentication confirmed, git worktree status checked, and project build stack identified.

---

### Step 2: Interactive Release Interview

Interview the user to resolve all release details before taking action:

1. **Version Tag Determination**:
   - Determine current latest tag: `git describe --tags --abbrev=0` (or `v0.0.0` if no tags exist).
   - Propose calculated semantic version bumps (Patch, Minor, Major).
   - Present recommendations to the user and confirm the target tag (e.g. `v1.2.0`).

2. **Release Type & Visibility**:
   - Ask the user to choose the release visibility:
     - **Production Release** (default)
     - **Pre-release** (adds `--prerelease` flag, e.g. `v1.2.0-rc.1`)
     - **Draft Release** (adds `--draft` flag for review on GitHub.com before publishing)

3. **Build Command & Output Verification**:
   - Confirm the build command to run (e.g., `npm run build`).
   - Confirm the path pattern of build artifacts to attach to the GitHub release.

4. **Git Sync & Commit Integration (`commit-and-push`)**:
   - Ask the user if they want to run the `commit-and-push` skill to commit pending changes (including `CHANGELOG.md` updates) and sync with remote before publishing the GitHub release.

_Completion Criterion_: Target version tag, release visibility flag, build command, artifact paths, and commit/push workflow agreed upon with the user.

---

### Step 3: Execute Build & Validate Artifacts

1. Run project test suite if available (e.g., `npm test` or `cargo test`).
2. Run agreed production build command.
3. Check for existence and non-zero size of generated build artifacts in target path.

_Completion Criterion_: Test and build commands complete with exit code 0, and expected build artifacts are verified on disk.

---

### Step 4: Draft Release Notes & Changelog Update

1. Retrieve git commit logs since the last tag:
   ```bash
   git log <last-tag>..HEAD --oneline
   ```
2. Combine commit history with GitHub CLI auto-generated notes draft:
   ```bash
   gh release create <tag> --generate-notes --draft
   ```
3. Format structured release notes into:
   - **Highlights & Features**
   - **Bug Fixes**
   - **Breaking Changes** (if any)
4. Present draft release notes to user for review/edits.
5. If `CHANGELOG.md` exists in repository root, append the approved release notes section under the new version header.
6. If agreed during the interview, invoke the `commit-and-push` skill to commit local changes and changelog updates to the remote repository.

_Completion Criterion_: Release notes drafted, approved by user, saved to temporary file, and committed/pushed if selected.

---

### Step 5: Publish GitHub Release

1. Execute the `gh release create` command with verified options:
   ```bash
   gh release create <tag> <artifact-paths...> --title "<tag>" --notes-file <notes-file-path> [--prerelease] [--draft]
   ```
2. Push git tag to remote if not automatically pushed by `gh`:
   ```bash
   git push origin <tag>
   ```

_Completion Criterion_: `gh release create` command completes with exit code 0.

---

### Step 6: Verification & Handshake

1. Fetch and display published release status:
   ```bash
   gh release view <tag>
   ```
2. Output clickable GitHub Release URL and summary of attached assets to the user.

_Completion Criterion_: Release details fetched from GitHub API, verified, and presented to user.
