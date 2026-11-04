<div align="center">
  <img src="assets/readme/animated-banner.svg" width="100%" alt="Animated techsavy-website project banner" />
</div>

# TECHSAVY

**Live website:** https://techsavy-ot9z7a.v2.appdeploy.ai/

**Administrator:** https://techsavy-ot9z7a.v2.appdeploy.ai/#admin

Computer sales, equipment supply and IT services, with a responsive animated storefront and a protected administration workspace.

## Implemented

- Home, Products, product details, Services, About and Contact.
- Animated circuit lines, aurora light, floating component icons and a CSS laptop illustration.
- Persistent motion pause and system reduced-motion support.
- Persistent guest product, bulk quotation, service and contact requests.
- Stable submission tokens prevent duplicate writes; original product price/name are retained.
- Managed sign-in with a server-enforced administrator email allowlist.
- Draft/published/archived product lifecycle, image uploads and main-image selection.
- Request transitions and audit events, editable company information.
- Opt-in estimated browser and page-view counts for today and all time.
- Configurable company email notifications; saved requests survive delivery failure.

## Development

Node 24 is used for the test runner.

```sh
npm ci
npm run typecheck
npm test
npm run preview:local
```

The local preview adapter is **design-only**. It returns an empty product catalog and explicitly refuses request writes and sign-in. It never reports fake successful submissions. `TECHSAVY_LOCAL_PREVIEW=1 npm run build` checks the frontend production bundle using this adapter.

## AppDeploy runtime

Deploy using `frontend+backend` with the `react-vite` template. AppDeploy injects `@appdeploy/client` and `@appdeploy/sdk`; do not add those packages to npm dependencies. `backend/index.ts` is the entry point. `types/appdeploy-contract.d.ts` is a local type-check contract copied from the documented SDK, not an implementation. Exclude it from AppDeploy source uploads; the platform provides its own SDK types.

Administrator access uses the AppDeploy SDK's `requireAuth()` and `requireAdminEmailAllowlist(ADMIN_EMAILS)` middleware. The explicit owner allowlist is server-side in `backend/index.ts`. Signing in with another account does not grant administrator access. Passwords and API keys are not committed.

Managed identity uses the provider's sign-in/recovery mechanisms, rather than app-owned password storage. Owner-session end-to-end QA requires signing in with the approved account.

## Email configuration

Enter `RESEND_API_KEY`, `EMAIL_FROM` and `COMPANY_EMAIL` through AppDeploy secure secret entry. Use a verified sender domain. The company notification contains a reference and directs the administrator to the dashboard; it does not put customer contact information in the email body. A notification marked Sent means accepted by the provider, not read by the recipient.

Missing credentials show **Not configured**. No email delivery is claimed until configured and tested. Customer acknowledgement email is not implemented yet; the customer receives an on-screen reference.

Reference: https://resend.com/docs/api-reference/emails/send-email

## Honest scope limits

- This is an initial implementation, not final SRS sign-off.
- No online payments, multi-item cart, stock reservation or courier integration.
- Catalog search currently applies to loaded bounded pages; Load more expands the search scope.
- Admin counts describe the current page rather than claiming global totals.
- Analytics supports today and all time; 7/30-day unique-browser windows are not yet implemented.
- Service descriptions are code-managed; company information is editable in Admin.
- Removing an image from a product unlinks it. Garbage collection of orphaned storage files is not yet automated.
- Privacy retention cleanup, backup scheduling/export and a verified restore procedure remain pre-production tasks.
- No claim is made that a signature check fully sanitizes images; a production image re-encoding pipeline is a follow-up.
- Hash routing is supported by AppDeploy. Search-engine product indexing requires a later server-rendered or prerendered deployment design.
- Official company contact details, product inventory and legal text still need to be supplied and approved.

## Vercel

No existing TECHSAVY Vercel project was found when work began. This app's backend, identity and storage depend on AppDeploy. A raw Vercel deployment of this repository is not a functioning backend deployment. Do not enable the local-preview adapter in production. A Vercel release needs a supported external API/auth bridge or migration to a Vercel-compatible backend first.

## Verification

`tests/domain.test.ts` tests validation and legal transitions. `tests/tests.json` defines five end-to-end acceptance workflows, including genuine persistence and authorization checks. Reports must distinguish passing automated checks, blocked owner-authenticated tests and unconfigured external services.

## Deployment status

AppDeploy reported ready on 4 November 2026, with no frontend, backend or network errors in its QA snapshot. This is not a claim that every acceptance workflow passed: owner-authenticated product management and email delivery still need verification. The catalog starts empty; the owner must add actual products and company contact details through Admin. Email credentials remain unconfigured.
