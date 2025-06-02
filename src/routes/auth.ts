import express from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthBody {
  email: string;
  password: string;
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body as AuthBody;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({
      message: 'Utilisateur créé',
      user: { email: newUser.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as AuthBody;

  try {
    const user = await User.findOne({ email })
      .populate('companies')
      .populate('selectedCompany');
      
    if (!user || !(await argon2.verify(user.password, password))) {
      return res.status(401).json({ message: 'Email ou mot de passe invalide' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        glpiId: user.glpiId,
      },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 4 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: 'Connexion réussie',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          glpiId: user.glpiId,
          companies: user.companies,
          selectedCompany: user.selectedCompany
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id);

  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  try {
    // Vérifier le mot de passe actuel
    const isValid = await argon2.verify(user.password, currentPassword);
    if (!isValid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    user.password = await argon2.hash(newPassword);
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Réinitialiser selectedCompany pour les utilisateurs de type "user"
    const user = await User.findById(req.user!._id);
    if (user && user.role === 'user') {
      user.selectedCompany = undefined;
      await user.save();
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user!._id)
      .select('-password')
      .populate('companies')
      .populate('selectedCompany');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Error in GET /me:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
