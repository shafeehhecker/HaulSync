# Contributing to HaulSync

Thank you for your interest in contributing! HaulSync is built in the open and welcomes all contributions.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork: `git clone https://github.com/shafeehhecker/haulsync.git`
3. **Set up** the dev environment (see README Quick Start)
4. **Create a branch**: `git checkout -b feature/your-feature-name`

---

## Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/short-description` | `feature/eway-bill-extension` |
| Bug fix | `fix/short-description` | `fix/rfq-quote-duplicate` |
| Docs | `docs/short-description` | `docs/api-reference-update` |
| Refactor | `refactor/short-description` | `refactor/analytics-queries` |

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add e-way bill auto-extension module
fix: prevent duplicate quotes on same RFQ
docs: update API reference for tracking events
refactor: extract pagination helper to utils
chore: upgrade prisma to 5.11
```

---

## Code Style

- **Backend**: Standard Node.js, async/await, no semicolons required but be consistent
- **Frontend**: React functional components + hooks only, no class components
- **CSS**: Tailwind utility classes; avoid custom CSS unless necessary
- **Variable names**: camelCase for JS, UPPER_SNAKE for env vars and enums

---

## Pull Request Process

1. Make sure all existing functionality still works
2. Add a clear PR description: what changed and why
3. Link any related issues: `Closes #42`
4. Keep PRs focused — one feature or fix per PR
5. Update docs if your change affects API or architecture

---

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, Docker version)
- Relevant logs or screenshots

---

## Feature Requests

Open an issue with the `enhancement` label. Describe:
- The use case / problem being solved
- Proposed solution
- Any alternatives considered

---

## Good First Issues

Look for issues tagged `good first issue` — these are self-contained tasks ideal for new contributors, such as:
- Adding new goods types to seed data
- Improving form validation messages
- Adding missing API query filters
- Writing unit tests for route handlers

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
