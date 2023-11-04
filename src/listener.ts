import { ethers, JsonRpcProvider, EventLog, id, ZeroAddress } from "ethers";
import "dotenv/config";

import { generateMetadata, generateSVG } from "./utils";

import { abi as contractABI } from "./contractABI";
import { Domain, LastProcessedEvent, Metadata } from "./setup/schema";

const baseUrl = process.env.BASE_URL || "";
const contractAddress = process.env.CA || "";
const alchemyRPC = process.env.ALCHEMY_RPC;

const provider = new JsonRpcProvider(alchemyRPC);
console.log(provider);

const contract = new ethers.Contract(contractAddress, contractABI, provider);

const contractCreatedBlock = process.env.START_BLOCK || 3528447;
export const processEvents = async () => {
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  const listenWithRetry = async () => {
    // Retrieve last processed event from the database
    const lastProcessed = await LastProcessedEvent.findOne({
      eventName: "DomainRegistered",
    });
    // Get current network information
    const startBlock = lastProcessed
      ? lastProcessed.lastProcessedBlock + 1
      : contractCreatedBlock;
    const currentBlock = await provider.getBlockNumber();
    const endBlock =
      +startBlock + 3000 < currentBlock ? +startBlock + 3000 : currentBlock;

    console.log("start block", startBlock);
    console.log("end block", endBlock);

    try {
      const domainRegLogs = await contract.queryFilter(
        contract.filters?.DomainRegistered(),
        startBlock, // Start from the next block
        endBlock // End at the current block
      );

      for (const log of domainRegLogs) {
        const eventLog = log as EventLog;
        const [owner, id, domainName] = eventLog.args;
        const existingMetadata = await Metadata.findOne({
          tokenId: id.toString(),
        });

        if (!existingMetadata) {
          const svg = generateSVG(domainName);
          const tokenId = Number(id);
          const json = generateMetadata(
            tokenId.toString(),
            domainName,
            svg as string
          );

          // Save metadata to the database
          await Metadata.create(json);
          await Domain.create({
            owner,
            domainName,
            chainId,
            tokenId,
          });
        } else {
          console.log(
            `Token ID ${id} already exists in the database. Skipping.`
          );
        }
      }

      const transferLogs = await contract.queryFilter(
        contract.filters?.Transfer(),
        startBlock,
        endBlock
      );

      for (const log of transferLogs) {
        const eventLog = log as EventLog;
        const [from, to, tokenId] = eventLog.args;

        if (from === ZeroAddress) continue;

        const currentOwner = await Domain.findOne({
          tokenId: tokenId.toString(),
        });

        if (!currentOwner) continue;

        currentOwner.owner = to;
        await currentOwner.save();
      }

      // Update last processed block in the collection
      if (lastProcessed) {
        lastProcessed.lastProcessedBlock = endBlock;
        await lastProcessed.save();
      } else {
        await LastProcessedEvent.create({
          eventName: "DomainRegistered",
          lastProcessedBlock: endBlock,
        });
      }

      // Start listening for new events every 15 seconds
      setTimeout(listenWithRetry, 20000);
    } catch (error) {
      console.log(error);
      console.log("Retrying after delay...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      listenWithRetry();
    }
  };

  listenWithRetry();
};
