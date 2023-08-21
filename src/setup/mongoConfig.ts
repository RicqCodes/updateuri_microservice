import "dotenv/config";
import mongoose from "mongoose";

const DB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DATABASE_PASSWORD}@cluster0.kswfdml.mongodb.net/nft_uri?retryWrites=true&w=majority`;
const connectToDatabase = async () => {
  try {
    await mongoose.connect(DB_URI);
    return mongoose.connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export default connectToDatabase;
