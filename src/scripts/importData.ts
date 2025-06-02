import { importExcelSheet } from "../services/exceltoMongo";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Chargement des variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  try {
    // Connexion à MongoDB avec l'URI du cluster
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI n'est pas défini dans le fichier .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    // Exécution de l'importation
    await importExcelSheet("RESEAUX- NAS");
    
    console.log("✅ Importation terminée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'importation:", error);
  } finally {
    // Fermeture de la connexion
    await mongoose.disconnect();
    console.log("✅ Déconnecté de MongoDB");
  }
}

// Exécution du script
main(); 