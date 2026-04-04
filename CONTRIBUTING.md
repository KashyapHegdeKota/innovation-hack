# Developer Guide & Contributing

Welcome to the hackathon! 🛠️

## 🌿 Branching Strategy
We use a lightweight branching strategy to keep the codebase clean.

- `main` - The production-ready branch. Never commit directly to `main`.
- `feat/feature-name` - New features.
- `fix/bug-name` - Bug fixes.
- `chore/task-name` - Chores (refactoring, dependencies, etc.).

### Workflow
1. Create a branch: `git checkout -b feat/user-auth`
2. Make your changes.
3. Push: `git push origin feat/user-auth`
4. Open a Pull Request.

## 📝 Commit Message Protocol
We use a simplified version of Conventional Commits.

**Format:** `type(scope): brief description`

**Types:**
- `feat`: A new feature (e.g., `feat(web): add login button`)
- `fix`: A bug fix (e.g., `fix(api): fix jwt verification`)
- `chore`: Chores and non-code changes (e.g., `chore(docs): update readme`)

## 🚨 Emergency Hackathon Rules
1. **Broken Main:** If `main` is broken, all work stops until it is fixed.
2. **New Dependencies:** If you add a dependency, communicate it immediately.
3. **Secrets:** NEVER commit API keys or Service Account JSONs.
4. **UID Isolation:** Always filter database queries by the Firebase UID.

## 🔗 Cloning
```bash
git clone https://github.com/KashyapHegdeKota/innovation-hack.git
```
