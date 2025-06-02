import express, { Request, Response, Router } from "express";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";
import argon2 from "argon2";

const router: Router = express.Router();

router.use(authMiddleware);

// Vérifier si l'utilisateur est admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Accès non autorisé" });
  }
  next();
};

// Fonction utilitaire pour exclure le mot de passe
const excludePassword = (user: any) => {
  const userObj = user.toObject();
  const { password, ...userWithoutPassword } = userObj;
  return userWithoutPassword;
};

// Obtenir la liste des utilisateurs
router.get("/users", isAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    const usersWithoutPassword = users.map(excludePassword);
    res.json(usersWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Obtenir un utilisateur spécifique
router.get("/users/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(excludePassword(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Créer un nouvel utilisateur
router.post("/users", isAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, role, name, glpiId, companies, selectedCompany } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    if (await User.findOne({ glpiId })) {
      return res.status(400).json({ message: "ID GLPI déjà utilisé" });
    }

    const user = new User({
      email,
      password,
      role,
      name,
      glpiId,
      companies: companies || [],
      selectedCompany,
    });

    await user.save();
    res.status(201).json(excludePassword(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Mettre à jour un utilisateur
router.put("/users/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    console.log('Tentative de modification utilisateur - ID:', req.params.id);
    console.log('Données reçues:', req.body);
    
    const { email, password, role, name, glpiId, companies, selectedCompany } = req.body;

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) {
      console.log('Email déjà utilisé par:', existingUser._id);
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Vérifier si le glpiId est déjà utilisé par un autre utilisateur
    const existingGlpiUser = await User.findOne({ glpiId, _id: { $ne: req.params.id } });
    if (existingGlpiUser) {
      console.log('GLPI ID déjà utilisé par:', existingGlpiUser._id);
      return res.status(400).json({ message: "ID GLPI déjà utilisé" });
    }

    const updateData: any = {
      email,
      role,
      name,
      glpiId,
      companies: companies || [],
      selectedCompany: selectedCompany || null,
    };

    console.log('Données de mise à jour:', updateData);

    // Si un nouveau mot de passe est fourni, le hacher
    if (password) {
      updateData.password = await argon2.hash(password);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      console.log('Utilisateur non trouvé avec ID:', req.params.id);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log('Utilisateur mis à jour avec succès:', user);
    res.json(excludePassword(user));
  } catch (err: any) {
    console.error('Erreur détaillée lors de la modification:', err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Supprimer un utilisateur
router.delete("/users/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
