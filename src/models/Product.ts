import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    gn: { type: Boolean, required: true},
    sku: { type: String, required: true, unique: true},
    name: { type: String, required: true },
    brand: { type: String, required: true},
    type: { type: String, required: true},
    model: { type: String, required: true},
    description: { type: String},
    description2: { type: String},
    price: { type: Number},
    pricet1: { type: Number},
    pricet2: { type: Number},
    pricet3: { type: Number},
    role: {
        type: String,
        enum: ["ordinateurs", "écrans", "réseaux - nas", "accessoires", "robot epson", "onduleurs", "imprimantes", "câbles", "téléphone ip", "occasions", "logiciels"],
        required: true,
    },
    image: { type: String, required: true}, 
    guarantee: { type: String},
    specs: {
        type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
    timestamps: true
});

export const Product = mongoose.model("Product", ProductSchema);