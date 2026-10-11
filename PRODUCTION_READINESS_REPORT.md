# Production readiness — 2026-09-30

**Audit and local preparation complete. Not deployed; production setup and release decisions remain.** Phase 1–3 behavior is feature-frozen. All five requested checks pass, including 100/100 tests. No workflow was rerun or changed during this audit.

## Blockers and release decisions

1. **Production does not exist.** The authenticated Convex deployment selector showed **“Production — Create a production deployment”**. Only the existing development deployment was listed. No production hostname, configuration, or data exists to validate yet. No Vercel project linkage exists locally; a remote Vercel account inventory was not inspected.
2. **Production configuration is pending:** independent Convex Auth keys, provider configuration, a production Resend webhook, and the frontend's production Convex URL. No secrets were inspected, copied, created, or changed.
3. **Sender restriction:** the Phase 3 development sender can send only to the Resend account owner's address. It supports an owner-controlled demonstration, but not judges/vendors receiving mail at arbitrary addresses. A verified sending domain is needed for that broader demo. [Resend restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)
4. **Public paid-action exposure:** password signup is open, without configured email verification. Any authenticated user can initiate bounded PDF analysis and vendor requests in their own workspace. Per-owner limits do not prevent multiple-account abuse or provide a global spend cap. Decide the access/spend policy before unattended public use; Vercel page protection alone does not secure the separately reachable Convex APIs. No new access-control feature was added.
5. **Dependency advisory:** the additional production-dependency audit reports one critical advisory for installed Next.js **16.3.3**, affecting Node.js `next/og` image generation with attacker-controlled SVG input. The maintainer lists **16.3.6** as patched; npm currently suggests **16.3.8**. This repository has no `next/og`, `ImageResponse`, or generated Open Graph image route, so the documented vulnerable path was not found. Resolve this release decision with a scoped patch and repeat validation, or a documented applicability assessment; the audit does not claim an exploitable application route. Dependencies were left unchanged. [Maintainer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j)
6. **GitHub setup is pending:** `.git` is absent. `git status --short --branch` reports “not a git repository”; there is no branch, commit, remote, tracked-file set, or history to audit.

## Changes made locally

| File                                   | Change                                                                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                            | Concise product/workflow, integration architecture, human boundaries, real validation caveat, accurate local/production setup and limits.                                                                             |
| `.env.example`                         | Public development URL placeholders; backend variable names separated from frontend config; removed account-specific receiving domain.                                                                                |
| `.gitignore`                           | Added common local credential, browser-profile and automation-output exclusions; retained `.env*` exclusion with `.env.example` exception.                                                                            |
| `PHASE2_REPORT.md`, `PHASE3_REPORT.md` | Replaced personal/deployment/provider/database identifiers with publication aliases; preserved dates, failures, observed results, model caveat and attestation limits. Historical checkpoints are explicitly labeled. |
| `app/page.tsx`                         | Corrected obsolete “planned/not integrated” PDF/email/AI claims and clarified attestation-only evidence; unchanged layout and styling.                                                                                |
| `app/app/page.tsx`                     | Changed the two misleading DEV simulation labels to DEMO. Existing simulation behavior and authorization are unchanged.                                                                                               |
| `PRODUCTION_READINESS_REPORT.md`       | This audit, classifications and manual release plan.                                                                                                                                                                  |

No backend code, schema, auth provider, test, package version or lockfile was changed. Change inventory was checked against a pre-edit file-hash baseline because Git metadata is absent.

## Validation results

| Check                                      | Observed result                                                                                                                                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                 | PASS — **100/100**, four files; exit 0.                                                                                                                                                                        |
| `npm run typecheck`                        | PASS — exit 0.                                                                                                                                                                                                 |
| `npm run lint`                             | PASS — exit 0.                                                                                                                                                                                                 |
| `npm run build -- --webpack`               | PASS — exit 0; compilation, all six routes, page generation and build traces completed.                                                                                                                        |
| `npx tsc --noEmit -p convex/tsconfig.json` | PASS — exit 0.                                                                                                                                                                                                 |
| Local read-only HTTP checks                | `/`, `/signin`, PDF sample and brand SVG returned 200; unauthenticated `/app` redirected to `/signin`; all landing fragment links exist; updated copy was served.                                              |
| Additional `npm audit --omit=dev --json`   | Registry response: **one critical Next.js advisory**, zero other severities; see applicability above. Initial sandbox DNS attempt failed; the permitted network retry succeeded. No audit fix/install was run. |
| Publication scan                           | No apparent live credentials or personal mailbox addresses found in initial-commit candidates; no browser profiles or temporary automation files found there.                                                  |

Tests ran after the two UI copy edits. Subsequent edits only adjusted documentation, ignore rules and formatting; no workflow behavior changed, so these results were retained. The build runs the strict project typecheck first; existing `next.config.ts` disables Next's redundant internal typecheck. Use the npm build script, not bare `next build`. No Convex push/codegen/deployment command was run for this audit. This is local validation, not a production smoke test or a full accessibility assessment.

## Production-safety occurrence classification

Classification groups cover the repeated matches in the scanned files; generated caches/dependencies and ignored environment values are not publishable source. Secret scans returned only paths/categories for suspected matches.

| Occurrence / location                                                                                 | Classification                             | Finding / action                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `localhost`, `127.0.0.1` in README local setup and historical Phase 2/3 reports                       | **Safe documentation**                     | Correct local/historical instructions, retained. No application CTA or runtime endpoint hardcodes them.                                                                                         |
| Localhost and example Convex URLs in installed `.agents`/`.claude` skill documentation                | **Safe documentation**                     | Tooling examples and the public Convex capability catalog, not Resolve runtime configuration. Retained.                                                                                         |
| Prior development deployment name, webhook host, personal mailbox and provider IDs in reports/setup   | **Must remove/fix — fixed**                | Replaced with publication aliases/placeholders. No old deployment-name match remains in publishable app/setup/report files.                                                                     |
| Development deployment selection/public URL names in ignored `.env.local`                             | **Needs production configuration**         | Preserve local selection; configure production independently. Values were not copied into release files.                                                                                        |
| Placeholder Convex URL in `.env.example`; fake endpoint/mailboxes in tests; sign-in email placeholder | **Safe documentation / test fixtures**     | Not credentials or production endpoints. Test transports are mocked.                                                                                                                            |
| `RESEND_FROM_EMAIL`, `RESEND_INBOUND_DOMAIN`, webhook endpoint                                        | **Needs production configuration**         | No provider address/domain is hardcoded into runtime source. Historical development sender is retained as a factual test result.                                                                |
| `whsec_` in `convex/coordination.test.ts` and installed billing skill examples                        | **Safe test fixture / documentation**      | Unit-test value is derived from an explicitly test-only string; skill text uses placeholder prefixes. No live signing secret found.                                                             |
| API/deploy-key names in `.env.example`, typed config/generated declarations and documentation         | **Needs production configuration**         | Names/types only. No live OpenAI, Resend, Convex deploy key or private-key payload found; no live `sk-` credential match.                                                                       |
| `console.warn` in inspection analysis and webhook verification                                        | **Safe diagnostic code — retained**        | Fixed categories, HTTP status, constrained error codes and booleans; no raw PDF/email, provider error object, signature or secret is logged. Generated guidelines also contain example logging. |
| Demo creation/simulation controls in Control Room                                                     | **Safe explicit demo behavior — retained** | Visible in production by design. Backend checks owner and `isDemo`; normal inspection graphs cannot use simulation. Human decision/verification gates still apply. DEV labels changed to DEMO.  |
| Synthetic PDF, generator, tests and landing previews                                                  | **Safe fixture/documentation — retained**  | Clearly illustrative; extractor is not hardcoded to fixture findings. No automatic seeding on page load. No claim of physical repair.                                                           |
| Stale landing/README Phase 1-only capability claims                                                   | **Must remove/fix — fixed**                | Corrected within the existing presentation. Local links/assets work; no layout redesign.                                                                                                        |
| Temporary browser profiles, stored sessions and automation results                                    | **Must exclude — checked**                 | None found among publication candidates. Prior automation artifacts remain outside this repository; added standard ignore patterns. Do not copy them into Git.                                  |

The scan included lockfile, source, docs, public assets and installed skill documentation. `.env.local` and other ignored credential files were not dumped. Ignore behavior was checked with an isolated temporary Git index/worktree view, without initializing this workspace. `.env.local`, other `.env*`, `.next`, `node_modules`, key files and listed browser artifacts are excluded; `.env.example` is intentionally included. This is a pattern/context review, not a guarantee against every possible secret format. There is no Git history to certify.

## Exact environment names

Names only; no secret values are included.

| Destination / function                          | Names                                                                                   | Requirement                                                                                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel / Next.js + Convex Auth client/server    | `NEXT_PUBLIC_CONVEX_URL`                                                                | Required at build and runtime; select production cloud URL.                                                                                         |
| Vercel optional tooling compatibility           | `NEXT_PUBLIC_CONVEX_SITE_URL`                                                           | **Not required/read** by this app or installed Convex Auth Next.js integration. May be generated by tooling.                                        |
| Convex / OpenAI                                 | `OPENAI_API_KEY`                                                                        | Required for live PDF extraction and vendor interpretation.                                                                                         |
| Convex / model override                         | `OPENAI_EXTRACTION_MODEL`                                                               | Optional; used by both model calls.                                                                                                                 |
| Convex / Resend                                 | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_FROM_EMAIL`, `RESEND_INBOUND_DOMAIN` | Required for complete live coordination; API permission must support sending and receiving reads.                                                   |
| Convex / auth                                   | `JWT_PRIVATE_KEY`, `JWKS`                                                               | Required independent production keypair/public key set.                                                                                             |
| Convex / auth redirect origin                   | `SITE_URL`                                                                              | Not required by the current password-only flow; recommended if configured, and required for relevant redirect/email auth flows if introduced later. |
| Convex platform-provided                        | `CONVEX_SITE_URL`, `CONVEX_CLOUD_URL`                                                   | Automatically supplied. Do not manually set or redeclare them.                                                                                      |
| Local Convex CLI                                | `CONVEX_DEPLOYMENT`                                                                     | Development selection; not a Vercel frontend requirement.                                                                                           |
| Optional later Vercel backend-deploy automation | `CONVEX_DEPLOY_KEY`                                                                     | Unnecessary for the recommended first manual backend deploy; sensitive, never public or shared with previews.                                       |

No `NEXTAUTH_URL`, `AUTH_SECRET`, OAuth client IDs/secrets, or additional public auth variable is required by the current code. Backend provider variables live in Convex, not Vercel. Typed optional provider declarations let deployment succeed without credentials; that does **not** mean live integrations work until configured.

## Auth and URL changes

Preserve Convex Auth and `providers: [Password]`. `convex/auth.config.ts` derives its issuer from platform `CONVEX_SITE_URL`; HTTP auth routes, Next server/client providers, and the route proxy are already wired. No provider migration or application source change is needed for the production hostname.

The installed password credentials path does not invoke the `SITE_URL` redirect helper. Official [Convex Auth manual setup](https://labs.convex.dev/auth/setup/manual) also says it is unnecessary for passwords alone. If initialized/set, use the chosen public HTTPS frontend origin instead of localhost; do not use the Convex backend origin for it. The public frontend URL is not yet chosen. Point `NEXT_PUBLIC_CONVEX_URL` at production and initialize independent production `JWT_PRIVATE_KEY`/`JWKS`; existing development accounts/sessions will not work there. The new HTTPS origin uses the existing secure-cookie behavior. Production signup, sign-in, refresh, sign-out and protected-route checks remain to be exercised after deployment.

## Resend production plan

The unchanged route is **POST `/resend-webhook` on the Convex HTTP-actions host**, not on Vercel and not on the Convex cloud API host. Once production exists, append `/resend-webhook` to its dashboard **HTTP Actions URL** (platform `CONVEX_SITE_URL`). Exact template:

```text
<production CONVEX_SITE_URL>/resend-webhook
```

There is no real production host to print yet. Do not derive it from the development hostname; regional domains may differ. Configure a separate production webhook with `email.received` and the implemented delivery events `email.sent`, `email.delivered`, `email.bounced`, `email.failed`, `email.suppressed`. Put that webhook's own signing secret in production `RESEND_WEBHOOK_SECRET`; do not reuse the development endpoint's secret. [Resend webhook setup](https://resend.com/docs/webhooks/introduction)

**The current receiving domain can remain.** It is provider configuration, independent of frontend/backend hostname. Replies address an opaque conversation token and can also correlate through RFC message references; matching uses records in the receiving deployment, not localhost, subject text or a dev URL. Production will create new conversation addresses; old development threads cannot become production conversations by changing a webhook. If both endpoints receive the same account events, the other environment may record unmatched events/retrieval work; there is no cross-environment routing service. Keep development data separate and decide webhook routing deliberately. A distinct receiving domain/account is optional isolation, not a current code requirement. [Resend receiving](https://resend.com/docs/dashboard/receiving/introduction)

**The development sender is insufficient for arbitrary judge mailboxes.** Keep it only for a demonstration whose email recipient is the Resend account owner. For broader recipients, verify a sending domain and configure `RESEND_FROM_EMAIL` accordingly. Changing the sender does not require changing the receiving domain. Deliverability, permitted recipients and receiving-read permissions must be checked by the operator; this audit did not inspect secret/API-key settings.

## Deployment order after approval

These are future manual actions, not actions performed by this audit.

1. Resolve the Next.js advisory release decision and public access/spend scope. Apply any separately authorized patch, rerun all five checks, and commit the reviewed release. Choose a stable public frontend hostname and a controlled vendor mailbox.
2. Initialize Git and create/push the empty GitHub repository using the commands below. Preserve the development environment and data.
3. In the **existing Convex project**, create/select its production deployment. Record its public cloud and HTTP-actions URLs. Use the existing project, not a new Vercel Marketplace-created Convex project. Production starts separately; development users, documents, graphs, emails and approvals are not copied.
4. Initialize production auth keys and provider configuration using the dashboards and [Convex Auth production setup](https://labs.convex.dev/auth/production). The official initializer is `npx @convex-dev/auth --prod`; review its prompts, target production explicitly, and preserve existing application wiring. Do not rerun source scaffolding or copy development keys. Set the chosen frontend origin if configuring `SITE_URL`.
5. With explicit deployment approval, confirm the target and deploy backend/schema using `npx convex deploy --typecheck enable`. No `--yes` shortcut. This command targets production from the local project selection; it is not a development-only command.
6. Create the Vercel project from the reviewed GitHub repository. Use **Next.js**, root `.`, Node.js **22.x**, install `npm ci`, build **`npm run build -- --webpack`**, default Next output. Set only the required frontend production variable above. Keep public preview builds disabled/unconfigured until they have isolated backend configuration. Do not share production backend keys/URLs with an untrusted preview workflow.
7. Create/configure the separate production Resend webhook and set its signing secret in Convex before any contact action. Confirm sender eligibility and receiving permissions. Keep the existing development webhook unchanged unless an explicit routing decision authorizes a change.
8. Deploy the Vercel frontend after the backend and environment are ready. Next public variables are embedded at build time, so rebuild after changing the backend URL. No static export: this app needs server auth/proxy behavior. Google Fonts are fetched during build, so build network access is needed. See [Convex/Vercel deployment](https://docs.convex.dev/production/hosting/vercel) and [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
9. Run a production smoke check with a fresh account. For a no-email demonstration, use existing **Create demo graph**. For a separately authorized live demonstration, upload the existing labeled synthetic PDF, review/confirm its actual proposals, create a fresh workflow, and enable coordination **before completing its first node**. Use a controlled vendor mailbox and keep human approvals/verification explicit. Do not import development database/auth snapshots or present synthetic attestations as real repair evidence.

The first release deliberately separates backend deployment from Vercel build, so **Vercel does not need `CONVEX_DEPLOY_KEY`**. Later approved CI could use a production-scoped key with `npx convex deploy --typecheck enable --cmd 'npm run build -- --webpack' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL`. That alternative deploys the backend and is outside this audit's stop point.

## GitHub commands to run later

From this workspace, after reviewing these changes:

```sh
git init
git branch -M main
git check-ignore .env.local
git add .
git diff --cached --name-only
git diff --cached --check
```

Review the staged file list before committing; it must exclude environment files, browser state and generated build output. The current scan found no apparent live secrets in candidates. If Git requests author identity, configure your chosen name and email yourself, then:

```sh
git commit -m "Prepare Resolve for production review"
```

Create an **empty public repository** on GitHub yourself, with your chosen owner/name and without an auto-generated README. Copy its actual SSH or HTTPS clone URL. Replace the placeholder below; it is deliberately not an invented remote:

```sh
git remote add origin '<YOUR_ACTUAL_GITHUB_CLONE_URL>'
git push -u origin main
```

Alternatively, after committing and authenticating GitHub CLI, run `gh repo create` without arguments. Choose to push an existing local repository, select this directory, and supply your own owner/name and public visibility in the interactive prompts. Choose one method only. None of these workspace Git/GitHub commands were executed during this audit.

## Remaining limits and stop point

Phase 3's model-classification mismatch, heuristic email parsing, attestation-only repair evidence, mailbox-versus-delivery-status distinction, bounded capacity, and unmeasured provider billing remain documented. No production load, recovery, retention or full accessibility certification was performed. The Convex review found owner checks, typed public arguments/returns, bounded indexed reads and internal scheduled handlers on the inspected paths; upload/webhook HTTP routes use capability/signature validation instead of a browser session. This is a scoped review, not a penetration test.

**Stopped before creating production, changing secrets/keys/webhooks, creating GitHub/Vercel projects, or deploying anything.** No new features, submission copy or Phase 4 work was added. The next step is the operator's release/configuration decisions, not another Phase 3 workflow run.
