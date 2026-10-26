# OMO Proof

Noncustodial community funding receipts tied to immutable campaign terms.

**Target:** PortalDot Hacker House, proposed Ecosystem DApps fit.

**Status:** implemented and locally tested. Vercel team authorization and live backend/provider setup remain required. No production deployment or competition submission is claimed.

Repository: https://github.com/code-up-matrix/omo

## Run and verify

Requires Node 24. Install with `npm ci`, then run `npm run check`. These checks do not require live credentials. See `.env.example` for configuration names.

Before connected development, link the correct Vercel project, attach its database and pull its environment. Run `npm run db:migrate`, then `npm run dev`. Open the workspace and use `/access` for connected operations. Public sample behavior is explicitly labeled.

## Product and integration

A browser hashes the exact campaign terms. The wallet creates a campaign with an immutable recipient, terms hash and deadline, then sends a contribution directly to that recipient. The contract rejects duplicate receipt IDs and emits a transfer event. The backend checks the configured chain, contract, successful receipt, canonical block and confirmation count before saving evidence in Postgres. A receipt proves the transfer and its terms hash, not delivery, identity or charity legitimacy.

Confirm official PortalDot V3 testnet RPC, EVM chain ID and native-unit decimals with the organizer. No network defaults or contract addresses are fabricated. A public candidate RPC returned HTTP 403 from this environment. Configure only verified values, obtain test tokens, run `npm run contracts:compile`, then deploy from a securely configured local environment with `npm run contracts:deploy`. Review the generated artifact and set `RECEIPT_CONTRACT_ADDRESS`. Never commit the deployer key. The provided deployment script requires explicit testnet confirmation.

Live proof still needed: registration/test-token access, real PortalDot contract deployment and explorer evidence, wallet flow, verified receipt saved to Postgres, and current check-in/demo requirements. The contract passed local EVM tests but has not received an independent audit. Do not use it for mainnet value.

## Evidence and handoff

- [Deployment and operations](docs/DEPLOYMENT.md)
- [Hackathon fit and submission checklist](docs/HACKATHON.md)
- [Demo recording script](docs/DEMO.md)
- [Research and event links](docs/RESEARCH.md)
- [Verification record](docs/VERIFICATION.md)

New application code is MIT licensed. AI-assisted implementation with Codex is disclosed. Third-party dependencies remain under their own licenses. Review and understand the code before submission; eligibility and awards are the organizer's decision.
