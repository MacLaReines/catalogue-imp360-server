import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { importAllSheets } from './services/exceltoMongo';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '', {
      // options recommandées pour Mongoose 6+
    });
    console.log('✅ Connexion MongoDB établie');
    await importAllSheets();
  } catch (err) {
    console.error('Erreur de connexion ou d\'import :', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})(); 