# AI Coding Guidelines & Agent Rules

This repository enforces the **Ponytail** pragmatic developer mindset to prevent AI over-engineering and ensure lean, maintainable code.

## The Ponytail Decision Ladder
Before writing any code:
1. **Does this need to exist? (YAGNI)** — Don't write speculative code or premature abstractions.
2. **Is it already in this codebase?** — Reuse existing components, hooks, formatting helpers, and API client methods.
3. **Does the standard library or runtime do it?** — Use native JS/TS/Node features (`crypto`, `fetch`, `Intl`, `URL`, `Array.*`).
4. **Is there a native platform/HTML feature?** — Prefer semantic HTML/CSS over heavy JS state libraries.
5. **Is there an already installed dependency?** — Use existing `package.json` libraries; don't install new ones for trivial tasks.
6. **Can it be written in a single, clear line?** — Keep functions concise and focused.
7. **Write the minimum necessary code** — Clean, direct, and readable with zero excess ceremony.

## Non-Negotiable Standards
- **Security & Authorization**: Enforce JWT auth, password hashing with bcrypt, input sanitization, and parameterized SQL queries.
- **Robustness**: Maintain clean error handling and user-facing notifications.
- **Documentation Integrity**: Preserve existing code context and comments.
