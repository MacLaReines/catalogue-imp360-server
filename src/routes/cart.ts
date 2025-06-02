import express from "express";
import { Cart } from "../models/Cart";
import { authMiddleware } from "../middleware/auth";
import { Document, Types } from "mongoose";

interface CartItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
}

interface CartDocument extends Document {
  user: Types.ObjectId;
  company: Types.ObjectId;
  items: CartItem[];
}

const router = express.Router();

// Obtenir le panier de l'utilisateur
router.get("/cart", authMiddleware, async (req, res) => {
  const cart = await (Cart as any).findOne({ 
    user: req.user!._id,
    company: req.user!.selectedCompany
  }).populate("items.product");
  res.json(cart || { items: [] });
});

// Ajouter un produit au panier
router.post("/cart", authMiddleware, async (req, res) => {
  try {
    console.log("POST /cart - Request body:", req.body);
    console.log("User complet:", JSON.stringify(req.user, null, 2));
    console.log("Selected Company:", req.user!.selectedCompany);
    console.log("Type de selectedCompany:", typeof req.user!.selectedCompany);
    
    if (!req.user!.selectedCompany) {
      console.log("Erreur: Pas d'entreprise sélectionnée");
      return res.status(400).json({ 
        message: "Veuillez sélectionner une entreprise avant d'ajouter des produits au panier" 
      });
    }

    const { productId, quantity = 1, price } = req.body;
    
    if (!price) {
      return res.status(400).json({ 
        message: "Le prix du produit est requis" 
      });
    }

    // Rechercher le panier existant pour cette entreprise
    let cart = await (Cart as any).findOne({ 
      user: req.user!._id,
      company: req.user!.selectedCompany 
    }) as CartDocument | null;
    console.log("Panier existant trouvé:", cart);

    if (!cart) {
      // Si pas de panier pour cette entreprise, en créer un nouveau
      console.log("Création d'un nouveau panier pour l'entreprise", req.user!.selectedCompany);
      cart = new Cart({ 
        user: req.user!._id,
        company: req.user!.selectedCompany,
        items: []
      }) as CartDocument;
    }

    // Ajouter ou mettre à jour le produit
    const existingItem = cart.items.find((item: CartItem) => item.product.toString() === productId);
    if (existingItem) {
      console.log("Mise à jour de la quantité du produit existant");
      existingItem.quantity += quantity;
    } else {
      console.log("Ajout d'un nouveau produit au panier");
      cart.items.push({ 
        product: new Types.ObjectId(productId), 
        quantity,
        price 
      });
    }

    await cart.save();
    console.log("Panier sauvegardé avec succès:", cart);
    res.json(cart);
  } catch (error: any) {
    console.error("Error in POST /cart - Détails complets:", {
      error: error.message,
      stack: error.stack,
      user: req.user,
      body: req.body
    });
    res.status(500).json({ 
      message: "Impossible d'ajouter le produit au panier", 
      error: error.message,
      details: error.errors 
    });
  }
});

// Modifier la quantité d'un produit
router.patch("/cart", authMiddleware, async (req, res) => {
  try {
    console.log("PATCH /cart - Request body:", req.body);
    console.log("User:", req.user);
    const { productId, quantity } = req.body;
    const cart = await (Cart as any).findOne({ 
      user: req.user!._id,
      company: req.user!.selectedCompany
    }) as CartDocument | null;

    if (!cart) return res.status(404).json({ message: "Panier introuvable" });

    const item = cart.items.find((i: CartItem) => i.product.toString() === productId);
    if (item) {
      console.log("Updating item quantity from", item.quantity, "to", quantity);
      item.quantity = quantity;
    }

    await cart.save();
    console.log("Cart updated successfully:", cart);
    res.json(cart);
  } catch (error: any) {
    console.error("Error in PATCH /cart:", error);
    res.status(500).json({ message: "Impossible de modifier la quantité", error: error.message });
  }
});

// Supprimer un produit du panier
router.delete("/cart/:productId", authMiddleware, async (req, res) => {
  try {
    console.log("DELETE /cart/:productId - ProductId:", req.params.productId);
    console.log("User:", req.user);
    const cart = await (Cart as any).findOne({ 
      user: req.user!._id,
      company: req.user!.selectedCompany
    }) as CartDocument | null;

    if (!cart) return res.status(404).json({ message: "Panier introuvable" });

    cart.set('items', cart.items.filter((i: CartItem) => i.product.toString() !== req.params.productId));
    console.log("Updated cart items:", cart.items);

    await cart.save();
    console.log("Cart updated successfully:", cart);
    res.json(cart);
  } catch (error: any) {
    console.error("Error in DELETE /cart/:productId:", error);
    res.status(500).json({ message: "Impossible de supprimer le produit", error: error.message });
  }
});

// Supprimer tout le panier
router.delete("/cart", authMiddleware, async (req, res) => {
  try {
    console.log("DELETE /cart");
    console.log("User:", req.user);
    const cart = await (Cart as any).findOne({ 
      user: req.user!._id,
      company: req.user!.selectedCompany
    }) as CartDocument | null;

    if (!cart) return res.status(404).json({ message: "Panier introuvable" });

    cart.set('items', []);
    await cart.save();
    console.log("Cart emptied successfully:", cart);

    res.json({ message: "Panier vidé", cart });
  } catch (error: any) {
    console.error("Error in DELETE /cart:", error);
    res.status(500).json({ message: "Impossible de vider le panier", error: error.message });
  }
});

export default router;
