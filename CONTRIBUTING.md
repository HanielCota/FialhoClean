# Contributing to FialhoClean

Thank you for your interest in contributing!

## Getting Started

1. **Fork** the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make sure Rust is installed via [rustup](https://rustup.rs/).
4. Run the app in development mode:
   ```bash
   npm run tauri dev
   ```

## Branching

- `main` is the protected production branch — do not push directly.
- Create a feature branch from `main`:
  ```bash
  git checkout -b feat/my-feature
  ```

## Commit Conventions

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code change without behavior change |
| `docs:` | Documentation only |
| `chore:` | Dependencies, config, tooling |

Example: `feat: add registry cleaner to optimizer`

## Before Submitting a PR

Run all checks locally:

```bash
npm run check:all
```

This runs Biome lint/format check and `cargo fmt --check` together.

## Pull Request

- Open a PR against `main`.
- Fill out the PR template completely.
- Keep PRs focused — one change per PR.
- Update `CHANGELOG.md` if the change is user-facing.
