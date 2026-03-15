import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://localhost:27017/cronie";
  if (!mongoUri || typeof mongoUri !== "string") {
    console.error("MongoDB connection failed: MONGO_URI is undefined or invalid.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;