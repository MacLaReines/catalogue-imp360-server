import mongoose, { Schema, Types } from "mongoose";

const CartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  items: [CartItemSchema],
});

// Index composé unique sur user et company
CartSchema.index({ user: 1, company: 1 }, { unique: true });

// Utiliser getModel pour éviter les conflits de modèle
const getModel = () => {
  try {
    return mongoose.model("Cart");
  } catch {
    return mongoose.model("Cart", CartSchema);
  }
};

export const Cart = getModel();
