import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  glpiId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  taux: {
    type: String,
    enum: ["taux1", "taux2", "taux3"],
    required: true,
    default: "taux1"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Company = mongoose.model("Company", CompanySchema); 