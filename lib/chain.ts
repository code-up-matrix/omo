import { JsonRpcProvider, getAddress } from "ethers";
import { AppError, required } from "./security";
import { decodeContribution } from "./proof";
export function config() {
  const chainId = Number(required("PORTALDOT_CHAIN_ID"));
  const decimals = Number(required("PORTALDOT_NATIVE_DECIMALS"));
  const confirmations = Number(process.env.RECEIPT_CONFIRMATIONS || 3);
  if (
    !Number.isSafeInteger(chainId) ||
    chainId <= 0 ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 18 ||
    !Number.isInteger(confirmations) ||
    confirmations < 1 ||
    confirmations > 100
  )
    throw new AppError(503, "Invalid chain configuration.");
  return {
    chainId,
    decimals,
    confirmations,
    address: getAddress(required("RECEIPT_CONTRACT_ADDRESS")),
    symbol: process.env.PORTALDOT_NATIVE_SYMBOL || "test POT",
    network: "PortalDot testnet",
  };
}
export async function verifyOnChain(txHash: string, receiptId: string) {
  const c = config();
  const url = new URL(required("PORTALDOT_RPC_URL"));
  if (
    url.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")
  )
    throw new AppError(503, "An HTTPS RPC is required.");
  const rpc = new JsonRpcProvider(url.href);
  try {
    const network = await rpc.getNetwork();
    if (network.chainId !== BigInt(c.chainId))
      throw new AppError(503, "RPC chain does not match configured chain.");
    const receipt = await rpc.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1)
      throw new AppError(
        409,
        "Successful transaction receipt is not available.",
      );
    const [block, height, code] = await Promise.all([
      rpc.getBlock(receipt.blockNumber),
      rpc.getBlockNumber(),
      rpc.getCode(c.address),
    ]);
    if (code === "0x")
      throw new AppError(503, "No contract exists at the configured address.");
    if (block?.hash !== receipt.blockHash)
      throw new AppError(409, "Receipt is not on the canonical chain.");
    const confirmations = height - receipt.blockNumber + 1;
    if (confirmations < c.confirmations)
      throw new AppError(
        409,
        `Wait for ${c.confirmations} confirmations; ${confirmations} currently observed.`,
      );
    let contribution;
    try {
      contribution = decodeContribution(receipt.logs, c.address, receiptId);
    } catch {
      throw new AppError(422, "No matching contribution from this contract.");
    }
    return {
      ...contribution,
      transactionHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      confirmations,
      contract: c.address,
      chainId: c.chainId,
      verifiedAt: new Date().toISOString(),
      mode: "on-chain",
      claim: "Transfer and terms-hash evidence only; delivery is not verified.",
    };
  } finally {
    rpc.destroy();
  }
}
