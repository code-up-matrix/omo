import { it, expect } from "vitest";
import ganache from "ganache";
import {
  BrowserProvider,
  ContractFactory,
  Contract,
  hexlify,
  randomBytes,
  parseEther,
  ZeroAddress,
  ZeroHash,
} from "ethers";
import { compile } from "../scripts/compile.mjs";
import { termsProof, decodeContribution } from "../lib/proof";
it("pays the recipient directly, verifies an event and rejects duplicates and expired campaigns", async () => {
  const g = ganache.provider({
    logging: { quiet: true },
    chain: { hardfork: "shanghai" },
  });
  const p = new BrowserProvider(g as any);
  p.pollingInterval = 20;
  try {
    const a = await p.getSigner(0),
      b = await p.getSigner(1);
    const c = compile();
    const factory = new ContractFactory(c.abi, "0x" + c.evm.bytecode.object, a);
    const deployed = await factory.deploy();
    await deployed.waitForDeployment();
    const contract = new Contract(await deployed.getAddress(), c.abi, a);
    const cid = hexlify(randomBytes(32)),
      rid = hexlify(randomBytes(32));
    const proof = termsProof({
      title: "Water pump repair",
      purpose: "Repair the shared community water pump.",
      recipient: await b.getAddress(),
    });
    const block = await p.getBlock("latest");
    await (
      await contract.createCampaign(
        cid,
        await b.getAddress(),
        proof.hash,
        block!.timestamp + 100,
      )
    ).wait();
    const before = BigInt(
      (await g.request({
        method: "eth_getBalance",
        params: [await b.getAddress(), "latest"],
      })) as string,
    );
    const receipt = await (
      await contract.contribute(cid, rid, { value: parseEther("0.1") })
    ).wait();
    const after = BigInt(
      (await g.request({
        method: "eth_getBalance",
        params: [await b.getAddress(), "latest"],
      })) as string,
    );
    expect(after - before).toBe(parseEther("0.1"));
    expect(await p.getBalance(await contract.getAddress())).toBe(0n);
    const decoded = decodeContribution(
      receipt.logs,
      await contract.getAddress(),
      rid,
    );
    expect(decoded.termsHash).toBe(proof.hash);
    expect(decoded.amountWei).toBe(parseEther("0.1").toString());
    expect(() => decodeContribution(receipt.logs, ZeroAddress, rid)).toThrow();
    await expect(
      contract.contribute.staticCall(cid, rid, { value: 1 }),
    ).rejects.toThrow();
    await expect(
      contract.contribute.staticCall(cid, hexlify(randomBytes(32)), {
        value: 0,
      }),
    ).rejects.toThrow();
    await expect(
      contract.createCampaign.staticCall(
        cid,
        await b.getAddress(),
        proof.hash,
        block!.timestamp + 100,
      ),
    ).rejects.toThrow();
    await expect(
      contract.createCampaign.staticCall(
        hexlify(randomBytes(32)),
        ZeroAddress,
        ZeroHash,
        block!.timestamp + 100,
      ),
    ).rejects.toThrow();
    await g.request({ method: "evm_increaseTime", params: [200] });
    await g.request({ method: "evm_mine", params: [] });
    await expect(
      contract.contribute.staticCall(cid, hexlify(randomBytes(32)), {
        value: 1,
      }),
    ).rejects.toThrow();
  } finally {
    await g.disconnect();
  }
}, 30000);
it("binds exact recipient and terms to the receipt hash", () => {
  const a = {
    title: "Repair fund",
    purpose: "Repair the public water pump.",
    recipient: "0x1111111111111111111111111111111111111111",
  };
  expect(termsProof(a).hash).not.toBe(
    termsProof({ ...a, purpose: "Buy a new water pump." }).hash,
  );
  expect(() => termsProof({ ...a, recipient: "not-a-wallet" })).toThrow();
});
