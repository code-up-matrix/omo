import { keccak256, toUtf8Bytes, Interface, getAddress } from "ethers";
import { z } from "zod";
export const Terms = z.object({
  title: z.string().min(3).max(120),
  purpose: z.string().min(10).max(2000),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});
export function termsProof(input: unknown) {
  const terms = Terms.parse(input);
  const normalized = {
    version: 1,
    title: terms.title.trim(),
    purpose: terms.purpose.trim(),
    recipient: getAddress(terms.recipient),
  };
  const canonical = JSON.stringify(normalized);
  return {
    terms: normalized,
    canonical,
    hash: keccak256(toUtf8Bytes(canonical)),
  };
}
export const ABI = [
  "function createCampaign(bytes32,address,bytes32,uint64)",
  "function contribute(bytes32,bytes32) payable",
  "function campaigns(bytes32) view returns(address creator,address recipient,bytes32 termsHash,uint64 deadline)",
  "event Contribution(bytes32 indexed campaignId,bytes32 indexed receiptId,address indexed contributor,address recipient,uint256 amount,bytes32 termsHash)",
];
export function decodeContribution(
  logs: readonly { address: string; topics: readonly string[]; data: string }[],
  address: string,
  receiptId: string,
) {
  const iface = new Interface(ABI);
  for (const log of logs) {
    if (log.address.toLowerCase() !== address.toLowerCase()) continue;
    let event;
    try {
      event = iface.parseLog({ topics: [...log.topics], data: log.data });
    } catch {
      continue;
    }
    if (
      event?.name === "Contribution" &&
      event.args.receiptId.toLowerCase() === receiptId.toLowerCase()
    )
      return {
        campaignId: event.args.campaignId,
        receiptId: event.args.receiptId,
        contributor: event.args.contributor,
        recipient: event.args.recipient,
        amountWei: event.args.amount.toString(),
        termsHash: event.args.termsHash,
      };
  }
  throw new Error("No matching contribution from the configured contract.");
}
