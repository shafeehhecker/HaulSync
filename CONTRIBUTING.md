# Contributing to HaulSync

Thank you for your interest in helping democratize logistics technology. We're building something meaningful here, and your engagement — whether as a contributor, adopter, or honest skeptic — matters.

---

## 🏗️ Current Status: Active Development

HaulSync is in active development across eight modules, each at different maturity stages. Right now, we're **not accepting external code contributions**, but we're building toward that. Here's why and what it means:

- **Modules are in rapid iteration** — architecture is still settling, APIs are stabilizing, and the shared patterns across the ecosystem are clarifying
- **We're validating operational assumptions** — talking to carriers, brokers, fleet operators, and auto suppliers to make sure what we build actually solves real problems
- **Documentation needs to catch up** — getting a new contributor up to speed requires docs we're still writing
- **We want the first wave of open contributions to succeed** — and right now, the friction would be too high

**This will change.** . We'll announce it here and in every module's README.

---

## 🚀 How to Engage Right Now

We can't accept PRs yet, but there are high-impact ways to get involved:

### 1. **Fork and Deploy**
The entire HaulSync ecosystem is MIT-licensed and self-hostable. Use it. Modify it. Run it on your own infrastructure. Prove out concepts. This is exactly what the open-source framing is for.

```bash
git clone https://github.com/HaulSync/[module-name]
cd [module-name]
docker-compose up
```

If you build something interesting on top of HaulSync, tell us. We'd genuinely like to know.

### 2. **Report Issues and Edge Cases**
Find bugs? Weird behavior? A workflow that breaks? Open an issue on the relevant module repository with:
- **What you were trying to do** — context matters
- **What happened** — the exact error or unexpected behavior
- **Your environment** — Node version, OS, whether you're self-hosted or demo
- **Steps to reproduce** — we need to see it too

We read every issue. Even if we can't fix it immediately, we log it and it influences the roadmap.

### 3. **Suggest Features — But Test Them First**
Before opening a feature request, try solving it in a fork. Does your idea actually work? Does it break something else? The best feature requests come with:
- **The operational problem you hit** — what workflow is broken, and why
- **Your proposed solution** — the specific change you'd make
- **How you validated it** — ideally, a branch where you prototyped it

We're especially interested in:
- Industry-specific workflows we haven't seen yet (freight corridors, carrier types, compliance regimes)
- Performance bottlenecks at scale
- Self-hosting infrastructure improvements

### 4. **Document What You Learn**
If you deploy a HaulSync module and figure something out — a config pattern that works, a performance tuning trick, a deployment topology — document it and share it. Wikis, blog posts, PRs to our docs, community Slack threads. The knowledge compounds.

### 5. **Join the Conversation**
- **Follow the roadmap** — watch the repository and GitHub Discussions to see what's coming
- **Validate the direction** — if you work in logistics, you know whether our assumptions are right. Tell us
- **Challenge us** — what are we missing? What would actually move the needle for your operations?

---

## 📋 What We're Looking For (For Later)

When we do open contributions, here's what we'll prioritize:

✅ **Wanted:**
- Bug fixes with tests
- Performance improvements with benchmarks
- Documentation improvements and tutorials
- Adapter implementations for new GPS/ELD/OEM providers (following the established `ISourceAdapter` pattern)
- Translations and localization
- Infrastructure improvements (Docker, deployment, monitoring)
- Module-specific features that don't break the shared architecture

❌ **Not wanted (yet):**
- Large architectural changes — we're still settling the patterns
- New modules without deep consensus on the problem they solve
- Dependencies that fragment the ecosystem (each module picks its own ORM, state library, etc.)
- Features that only work in one-module deployments

---

## 🏛️ Code of Conduct

Be respectful. We're building for an industry where people's livelihoods are on the line — logistics isn't abstract. Disagreements happen; bad faith doesn't.

---

## 🔐 Security

Found a security vulnerability? **Do not open a public issue.** Email `security@haulsync.io` with:
- The vulnerability description
- Steps to reproduce
- Potential impact
- Your suggested fix (if you have one)

We'll respond within 48 hours and work with you on disclosure timing.

---

## 📚 Resources

- **[HaulSync Architecture Docs](./docs/ARCHITECTURE.md)** — how modules integrate
- **[Deployment Guide](./docs/DEPLOYMENT.md)** — self-hosting setup
- **[API Reference](./docs/API.md)** — standardized schemas across modules
  
---

## 💌 When Contributions Open

We'll update this file, email our mailing list, and make noise across all channels. Here's what that moment will look like:

1. **Per-module CONTRIBUTING.md** — specific setup and testing for each module
2. **Good-first-issue labels** — curated starting points for newcomers
3. **Contributor swag** — we take care of our people
4. **Code review SLA** — PRs will get feedback within one week
5. **Mentorship pairing** — your first contribution won't be alone

---

## 🙏 Why We're Doing This Carefully

The logistics industry doesn't have a lot of trust in vendors. You're right to be skeptical of new platforms. What makes HaulSync different isn't just the code — it's the **governance**: an ecosystem where you own your stack, where features don't require you to upgrade your license, and where the core technology is read-auditable by anyone.

We're taking the same care with how we build community. We're not trying to move fast and break things — we're trying to build something durable that stays true to the founding mission: democratize logistics technology, no vendor lock-in, no opaque pricing.

---

## 📞 Questions?

- **Deployment help** — open an issue or check the docs
- **Business/partnership** — Reach us through Linkedin 

---

*The HaulSync ecosystem is built in the open, for the people who actually run supply chains. Thanks for being part of that vision.*

⚡ **Your Freight. Fully Synced.**
