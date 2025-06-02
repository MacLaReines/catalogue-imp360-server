import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/upload";
import productRoutes from "./routes/product";
import cartRoutes from "./routes/cart";
import glpiRoutes from "./routes/glpi";
import userRoutes from "./routes/users";
import companyRoutes from "./routes/companies";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://catalogue-imp360-client.vercel.app"
  ],
  credentials: true,
}));

// Configuration CORS spécifique pour les routes GLPI
app.use("/api/glpi", cors({
  origin: "*",
  credentials: false,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", glpiRoutes);
app.use("/api", userRoutes);
app.use("/api", companyRoutes);

app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

// Connexion MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
