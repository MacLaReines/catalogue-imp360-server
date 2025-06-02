import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  email: string;
  taux: "taux1" | "taux2" | "taux3";
  role: string; 
  iat: number;
  exp: number;
}

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as JwtPayload;

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Accès interdit: admin requis" });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      taux: decoded.taux,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};
