import { ethers, JsonRpcProvider, EventLog } from "ethers";
import "dotenv/config";

import { generateMetadata, generateSVG } from "./utils";

import { abi as contractABI } from "./contractABI";
import { Domain, LastProcessedEvent, Metadata } from "./setup/schema";

const baseUrl = process.env.BASE_URL || "";
const contractAddress = process.env.CA || "";
const alchemyRPC = process.env.ALCHEMY_RPC;

const provider = new JsonRpcProvider(alchemyRPC);

const contract = new ethers.Contract(contractAddress, contractABI, provider);

const contractCreatedBlock = process.env.START_BLOCK || 8713686;
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
      ? lastProcessed.lastProcessedBlock
      : contractCreatedBlock;
    const currentBlock = await provider.getBlockNumber();
    const endBlock =
      +startBlock + 3000 < currentBlock ? +startBlock + 3000 : currentBlock;

    console.log("start block", startBlock);
    console.log("end block", endBlock);

    try {
      const logs = await contract.queryFilter(
        contract.filters?.DomainRegistered(),
        startBlock, // Start from the next block
        endBlock // End at the current block
      );

      for (const log of logs) {
        const eventLog = log as EventLog;
        const [owner, id, domainName] = eventLog.args;
        console.log(owner, id, domainName);

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
          const metadata = await Metadata.create(json);
          const domain = await Domain.create({ owner, domainName, chainId });
          console.log(metadata);
          console.log(domain);
        } else {
          console.log(
            `Token ID ${id} already exists in the database. Skipping.`
          );
        }
      }

      // Update last processed block in the collection
      if (lastProcessed) {
        lastProcessed.lastProcessedBlock = currentBlock;
        await lastProcessed.save();
      } else {
        await LastProcessedEvent.create({
          eventName: "DomainRegistered",
          lastProcessedBlock: currentBlock,
        });
      }

      // Start listening for new events every 5 seconds
      setTimeout(listenWithRetry, 15000);
      // // Start listening for new events
      // contract.on("DomainRegistered", async (owner, tokenId, domainName) => {
      //   console.log(
      //     `Received Register event for tokenId ${tokenId}, name ${domainName}, domainName ${domainName}`
      //   );

      //   const existingMetadata = await Metadata.findOne({
      //     tokenId: tokenId.toString(),
      //   });

      //   console.log(existingMetadata);

      //   if (!existingMetadata) {
      //     const svg = generateSVG(domainName);
      //     const id = Number(tokenId);
      //     const json = generateMetadata(
      //       id.toString(),
      //       domainName,
      //       svg as string
      //     );

      //     // Save metadata to the database
      //     const metadata = await Metadata.create(json);
      //     const domain = await Domain.create({ owner, domainName, chainId });
      //     console.log(metadata);
      //     console.log(domain);
      //   } else {
      //     console.log(
      //       `Token ID ${tokenId} already exists in the database. Skipping.`
      //     );
      //   }
      // });
    } catch (error) {
      console.log(error);
      console.log("Retrying after delay...");
      setTimeout(listenWithRetry, 5000);
    }
  };

  listenWithRetry();
};
