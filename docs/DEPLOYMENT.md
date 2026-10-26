# Deployment and operations

Status at handoff: source implemented and local automated verification performed. Live service verification is pending. The Vercel connection denied access to team `team_64IDAvx3sgtTRCQpQavfF3cG` (`emmanuel-dukes-projects`). No deployment URL or database has been provisioned for this app yet.

1. Grant the connected Vercel app access to that team. Import this GitHub repository as its own Next.js project, Node 24. Keep the root directory unset and use `npm run build`. Region: fra1.
2. Provision a dedicated Neon Postgres database using Vercel Marketplace. Keep preview and production databases separate. Attach `DATABASE_URL` only to this app.
3. Set the variables from `.env.example` in Vercel. Generate a unique random `SESSION_SECRET` with at least 32 bytes and long independent operator/judge access codes. Do not put real credentials in this public repository or chat.
4. Link the local checkout to the correct Vercel project and pull its environment. Verify the project and environment before running `npm run db:migrate`. Migrations use idempotent CREATE statements and never run automatically during build.
5. Deploy the exact reviewed main commit to production. Inspect build and function logs, open `/api/health`, and complete the product-specific live flow described in HACKATHON.md. A configured health response does not prove provider connectivity.
6. Test access control, ownership, a provider failure and a repeat request against the deployed app. Record real transaction/query evidence in the submission. Set AI Gateway budgets for apps using AI.
7. Give judges a dedicated access code through the private judging instructions. Do not publish access codes or payment credentials in README. Rotate codes after judging. Session cookies expire after eight hours. This single-workspace login is suitable for a controlled hackathon demo, not a multi-organization identity system.
8. Configure provider webhooks where applicable, monitor errors and database usage, enable Neon backups, and regularly delete rate-limit buckets older than two days. Define report retention with the owner before collecting personal or proprietary data.

Rollback: promote a previously verified Vercel deployment. Database changes here are additive, so rollback does not require deleting data. Never reset a shared production database to fix a deployment.

## Production acceptance gates

- Successful live database write/read scoped to the signed-in session.
- Successful provider integration using the correct test/sandbox environment.
- Browser flow at desktop and mobile widths, including errors and cancellation.
- Published demo, private judge access, operational owner and budget limits.
- Provider terms, eligibility, and current event deadlines checked by the entrant.

Until these gates are evidenced, describe this as a tested implementation awaiting deployment and integration verification, not a production-complete service.
