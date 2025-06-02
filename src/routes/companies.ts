import express, { Request, Response } from "express";
import { Company } from "../models/Company";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.use(authMiddleware);

// Vérifier si l'utilisateur est admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Accès non autorisé" });
  }
  next();
};

// Obtenir la liste des entreprises
router.get("/companies", async (_req: Request, res: Response) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Obtenir une entreprise spécifique
router.get("/companies/:id", async (req: Request, res: Response) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Créer une nouvelle entreprise
router.post("/companies", isAdmin, async (req: Request, res: Response) => {
  try {
    const { glpiId, name, taux } = req.body;

    if (await Company.findOne({ glpiId })) {
      return res.status(400).json({ message: "ID GLPI déjà utilisé" });
    }

    const company = new Company({
      glpiId,
      name,
      taux,
    });

    await company.save();
    res.status(201).json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Mettre à jour une entreprise
router.put("/companies/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const { glpiId, name, taux } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { glpiId, name, taux },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }

    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer une entreprise
router.delete("/companies/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }

    // Supprimer l'entreprise de la liste des entreprises des utilisateurs
    await User.updateMany(
      { companies: req.params.id },
      { $pull: { companies: req.params.id } }
    );

    res.json({ message: "Entreprise supprimée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Sélectionner une entreprise pour un utilisateur
router.post("/select-company", async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'entreprise existe et si l'utilisateur y a accès
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }

    if (!user.companies.includes(companyId)) {
      return res.status(403).json({ message: "Vous n'avez pas accès à cette entreprise" });
    }

    user.selectedCompany = companyId;
    await user.save();

    // Retourner l'utilisateur avec l'entreprise sélectionnée
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('companies')
      .populate('selectedCompany');

    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Réinitialiser l'entreprise sélectionnée d'un utilisateur
router.post("/reset-company", authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log("Réinitialisation de l'entreprise pour l'utilisateur:", req.user!._id);
    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Réinitialiser l'entreprise sélectionnée
    user.selectedCompany = undefined;
    await user.save();
    console.log("Entreprise réinitialisée avec succès");

    res.json({ message: "Entreprise réinitialisée avec succès" });
  } catch (err) {
    console.error("Erreur lors de la réinitialisation de l'entreprise:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router; 