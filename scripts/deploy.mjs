import { Wallet, JsonRpcProvider, ContractFactory } from "ethers";
import fs from "node:fs";
import { compile } from "./compile.mjs";
for (const k of [
  "PORTALDOT_RPC_URL",
  "PORTALDOT_CHAIN_ID",
  "DEPLOYER_PRIVATE_KEY",
])
  if (!process.env[k])
    throw Error(k + " must be set in your local environment.");
if (process.env.CONFIRM_TESTNET_DEPLOY !== "yes")
  throw Error(
    "Verify the official testnet configuration and set CONFIRM_TESTNET_DEPLOY=yes.",
  );
const provider = new JsonRpcProvider(process.env.PORTALDOT_RPC_URL);
try {
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(process.env.PORTALDOT_CHAIN_ID))
    throw Error("Chain mismatch");
  const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const artifact = compile();
  const factory = new ContractFactory(
    artifact.abi,
    "0x" + artifact.evm.bytecode.object,
    wallet,
  );
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const record = {
    chainId: network.chainId.toString(),
    address: await contract.getAddress(),
    transactionHash: contract.deploymentTransaction().hash,
    compiler: "solc 0.8.38",
    evmVersion: "paris",
    deployedAt: new Date().toISOString(),
  };
  fs.mkdirSync("artifacts", { recursive: true });
  fs.writeFileSync(
    "artifacts/deployment.json",
    JSON.stringify(record, null, 2),
  );
  console.log(JSON.stringify(record));
} finally {
  provider.destroy();
}
