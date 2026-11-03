# TECHSAVY implementation checklist

- React/Vite public Home, Products, About, Services, Contact and protected admin.
- CSS circuit/aurora background, device illustration, pause control and reduced motion.
- Persistent catalog and request APIs, atomic request receipts, bounded pagination.
- Allowlisted managed admin sign-in, product image validation, content editing.
- Request transitions, history, email notification configuration and retry.
- Anonymous opt-in analytics with explicit limits; no fabricated traffic.
- Git source, tests, deployment instructions and known limitations.

## Preflight

- Use AppDeploy frontend+backend/react-vite template and documented SDK imports.
- Only new files and template diffs; unique paths; exactly one full tests/tests.json.
- Five QA workflows cover public browsing, submissions/failures, admin CRUD/uploads,
  request management/content and authorization/motion/mobile behavior.
- Exactly one sanity test, valid JSON, no secrets in source, no invented contacts.
- Check types, unit tests and production build before deployment.
- Retain one app ID through retries and inspect terminal QA results.

## Architecture decision

AppDeploy owns the API, app-isolated database, managed identity and image storage.
GitHub is the source repository. The Vite frontend is portable, but the AppDeploy
SDK must not be assumed to work on a separate Vercel origin without its supported
transport/auth setup. Vercel production deployment is not claimed by this project.
Managed passwordless/social sign-in replaces the SRS's proposed password reset flow.
The initial administrator allowlist is the project owner's previously supplied email.
No first-visitor-becomes-admin behavior is permitted.
