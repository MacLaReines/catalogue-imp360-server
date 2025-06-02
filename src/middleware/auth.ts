import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  glpiId: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: string;
        glpiId: string;
        selectedCompany?: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Récupérer l'utilisateur avec son entreprise sélectionnée
    const user = await User.findById(decoded.userId).select('selectedCompany');
    
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    req.user = {
      _id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      glpiId: decoded.glpiId,
      selectedCompany: user.selectedCompany?.toString()
    };
    
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Token invalide" });
  }
};
