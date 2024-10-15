import mongoose from "mongoose";
import { app } from "./app";
require("dotenv").config();

const PORT = 3000;

const start = async () => {
  console.log("Starting the Auth service");

  if (!process.env.ACCESS_TOKEN_JWT_KEY) {
    console.log("ACCESS_TOKEN_JWT_KEY must be defined.");
    process.exit();
  }

  if (!process.env.REFRESH_TOKEN_JWT_KEY) {
    console.log("REFRESH_TOKEN_JWT_KEY must be defined.");
    process.exit();
  }

  if (!process.env.MONGO_URI) {
    console.log("MONGO_URI must be defined.");
    process.exit();
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to mongodb successfully");
  } catch (error) {
    console.log("Database connection error", error);
    process.exit();
  }

  app.listen(PORT, () => {
    console.log(`Auth service listening on port ${PORT}`);
  });
};

start();
