"use client";
import { useState } from "react";
import {
  BrowserProvider,
  Contract,
  hexlify,
  randomBytes,
  parseUnits,
  type Eip1193Provider,
} from "ethers";
import { Workspace, Download, post } from "@/components/workspace";
import { termsProof, ABI } from "@/lib/proof";
type Campaign = {
  id: string;
  hash: string;
  canonical: string;
  recipient: string;
  deadline: number;
  transactionHash?: string;
};
type Chain = {
  chainId: number;
  decimals: number;
  address: string;
  symbol: string;
};
export default function Page() {
  const [title, setTitle] = useState("Restore the community water pump");
  const [purpose, setPurpose] = useState(
    "Fund the replacement pump seal and publish the repair evidence for our community.",
  );
  const [recipient, setRecipient] = useState("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [amount, setAmount] = useState("0.01");
  const [tx, setTx] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [report, setReport] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed.");
    } finally {
      setBusy(false);
    }
  }
  async function wallet() {
    const res = await fetch("/api/chain");
    const data = await res.json();
    if (!res.ok) throw Error(data.error);
    const chain = data as Chain;
    const ethereum = (window as unknown as { ethereum?: Eip1193Provider })
      .ethereum;
    if (!ethereum)
      throw Error("Install an EVM wallet to use the configured testnet.");
    const p = new BrowserProvider(ethereum);
    await p.send("eth_requestAccounts", []);
    const network = await p.getNetwork();
    if (network.chainId !== BigInt(chain.chainId))
      throw Error(
        "Switch your wallet to the verified PortalDot testnet configuration before continuing.",
      );
    const signer = await p.getSigner();
    return { contract: new Contract(chain.address, ABI, signer), chain };
  }
  function draft() {
    const proof = termsProof({ title, purpose, recipient });
    setCampaign({
      id: hexlify(randomBytes(32)),
      hash: proof.hash,
      canonical: proof.canonical,
      recipient: proof.terms.recipient,
      deadline: Math.floor(Date.now() / 1000) + 7 * 86400,
    });
    setReport(null);
    setMessage("Terms hashed locally. Nothing has been sent to a blockchain.");
  }
  async function create() {
    if (!campaign) return;
    const { contract } = await wallet();
    const result = await contract.createCampaign(
      campaign.id,
      campaign.recipient,
      campaign.hash,
      campaign.deadline,
    );
    setMessage("Waiting for campaign transaction confirmation…");
    await result.wait();
    setCampaign({ ...campaign, transactionHash: result.hash });
    setMessage("Campaign confirmed. Save its terms bundle before continuing.");
  }
  async function contribute() {
    if (!campaign?.transactionHash)
      throw Error("Create and confirm the campaign first.");
    const { contract, chain } = await wallet();
    const rid = hexlify(randomBytes(32));
    const current = await contract.campaigns(campaign.id);
    if (
      current.termsHash !== campaign.hash ||
      current.recipient.toLowerCase() !== campaign.recipient.toLowerCase()
    )
      throw Error("On-chain campaign does not match this terms bundle.");
    const value = parseUnits(amount, chain.decimals);
    if (value <= 0n) throw Error("Contribution must be greater than zero.");
    const result = await contract.contribute(campaign.id, rid, { value });
    setTx(result.hash);
    setReceiptId(rid);
    setMessage("Waiting for transfer confirmation…");
    await result.wait();
    setMessage("Transfer mined. Verify after the required confirmations.");
  }
  return (
    <Workspace name="OMO / PROOF" tag="COMMUNITY FUNDING">
      <section className="hero">
        <div>
          <span className="eyebrow">A SHARED GOAL. A VERIFIABLE RECORD.</span>
          <h1>
            Fund the work.
            <br />
            <em>Follow the proof.</em>
          </h1>
          <p>
            Commit to clear terms, contribute directly to the recipient, and
            verify the transfer from a PortalDot contract event.
          </p>
        </div>
        <div className="hero-symbol">
          03
          <span>
            COMMIT
            <br />
            CONTRIBUTE
            <br />
            VERIFY
          </span>
        </div>
      </section>
      <div className="workspace-grid">
        <aside className="panel">
          <div className="panel-title">
            <span>Define the campaign</span>
            <span className="number">01</span>
          </div>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </label>
          <label>
            What will this fund?
            <textarea
              rows={4}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              maxLength={2000}
            />
          </label>
          <label>
            Recipient wallet
            <input
              value={recipient}
              placeholder="0x…"
              onChange={(e) => setRecipient(e.target.value)}
            />
          </label>
          <button disabled={busy} onClick={() => action(async () => draft())}>
            Prepare terms bundle →
          </button>
          <p className="caption">
            Local hashing is free. Wallet actions require a configured testnet
            and test tokens.
          </p>
          <p role="alert" className="error">
            {error}
          </p>
          <p role="status" className="caption">
            {message}
          </p>
        </aside>
        <section>
          <div className="metrics">
            <div>
              <span>Custody</span>
              <strong className="metric-word">Direct</strong>
            </div>
            <div>
              <span>Terms</span>
              <strong className="metric-word">Immutable</strong>
            </div>
            <div>
              <span>Network target</span>
              <strong className="metric-word">Testnet</strong>
            </div>
          </div>
          {campaign ? (
            <article className="panel finding">
              <span className="status watch">
                {campaign.transactionHash
                  ? "Campaign confirmed"
                  : "Local draft · not on-chain"}
              </span>
              <h2>{JSON.parse(campaign.canonical).title}</h2>
              <p>{JSON.parse(campaign.canonical).purpose}</p>
              <dl className="proof-data">
                <dt>Recipient</dt>
                <dd>{campaign.recipient}</dd>
                <dt>Terms hash</dt>
                <dd>{campaign.hash}</dd>
                <dt>Campaign ID</dt>
                <dd>{campaign.id}</dd>
              </dl>
              <div className="actions">
                <Download data={campaign} name="omo-terms-bundle.json" />
                {!campaign.transactionHash ? (
                  <button disabled={busy} onClick={() => action(create)}>
                    Create campaign with wallet
                  </button>
                ) : null}
              </div>
              {campaign.transactionHash ? (
                <div className="next-step">
                  <label>
                    Contribution · test native token
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </label>
                  <button disabled={busy} onClick={() => action(contribute)}>
                    Review transfer in wallet ↗
                  </button>
                  <p className="caption">
                    Wallet confirmation sends tokens directly to the recipient
                    above. This receipt does not prove delivery.
                  </p>
                </div>
              ) : null}
            </article>
          ) : (
            <div className="panel empty">
              <span className="empty-mark">◈</span>
              <h2>
                Everyone can inspect
                <br />
                the same promise.
              </h2>
              <p>
                A content hash binds each transfer receipt to the exact campaign
                terms. Your wallet approves every on-chain action.
              </p>
              <div className="flow-labels">
                <span>Terms</span>
                <span>→</span>
                <span>Direct transfer</span>
                <span>→</span>
                <span>Evidence</span>
              </div>
            </div>
          )}
          <article className="panel finding" id="verify">
            <span className="eyebrow">INDEPENDENT RECEIPT CHECK</span>
            <h2>Verify a contribution</h2>
            <label>
              Transaction hash
              <input
                value={tx}
                onChange={(e) => setTx(e.target.value)}
                placeholder="0x…"
              />
            </label>
            <label>
              Receipt ID
              <input
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
                placeholder="0x…"
              />
            </label>
            <button
              disabled={busy}
              onClick={() =>
                action(async () => {
                  const data = await post("/api/verify", {
                    transactionHash: tx,
                    receiptId,
                  });
                  setReport(data);
                  setMessage(
                    "Receipt verified against the configured chain and saved.",
                  );
                })
              }
            >
              Verify & save receipt
            </button>
            {report ? (
              <div className="next-step">
                <p className="status watch">On-chain transfer verified</p>
                <pre className="json-proof">
                  {JSON.stringify(report, null, 2)}
                </pre>
                <Download data={report} name="omo-verified-receipt.json" />
              </div>
            ) : null}
          </article>
          <p className="caption legal">
            Testnet prototype · No custody · No refunds enforced by the contract
            · Contract audit and real-network verification are still required
            before handling value
          </p>
        </section>
      </div>
    </Workspace>
  );
}
