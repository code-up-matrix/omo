import fs from "node:fs";
import solc from "solc";
export function compile() {
  const source = fs.readFileSync(
    new URL("../contracts/ProofPot.sol", import.meta.url),
    "utf8",
  );
  const output = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: { "ProofPot.sol": { content: source } },
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "paris",
          outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
      }),
    ),
  );
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length)
    throw Error(errors.map((e) => e.formattedMessage).join("\n"));
  return output.contracts["ProofPot.sol"].ProofPot;
}
if (process.argv[1]?.endsWith("compile.mjs")) {
  const c = compile();
  fs.mkdirSync("artifacts", { recursive: true });
  fs.writeFileSync(
    "artifacts/ProofPot.json",
    JSON.stringify(
      { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object },
      null,
      2,
    ),
  );
  console.log("Compiled ProofPot; target EVM Paris.");
}
