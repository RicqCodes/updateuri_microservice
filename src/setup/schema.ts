import mongoose from "mongoose";

const metadataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tokenId: {
      type: String,
      unique: true,
      required: true,
      select: false,
    },
    description: {
      type: String,
      default: "A domain on the test name service",
    },
    image: {
      type: String,
      required: true,
    },
    external_url: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

const lastProcessedEventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
    },
    lastProcessedBlock: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const domainSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
    },
    domainName: {
      type: String,
      unique: true,
      required: true,
    },
    chainId: {
      type: String,
      required: true,
    },
    tokenId: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

domainSchema.index({ owner: 1, chain: 1 });

export const Metadata = mongoose.model("Metadata", metadataSchema);
export const LastProcessedEvent = mongoose.model(
  "LastProcessedEvent",
  lastProcessedEventSchema
);
export const Domain = mongoose.model("Domain", domainSchema);
