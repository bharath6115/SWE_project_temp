const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.DB_NAME || "campus_bus_tracking",
  });
  console.log("MongoDB connected");
};

module.exports = connectDB;
