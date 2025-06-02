import mongoose from "mongoose";
import argon2 from "argon2";

// Définir les rôles possibles comme une constante
const USER_ROLES = ["client", "user", "admin", "moderator"] as const;
type UserRole = typeof USER_ROLES[number];

// Interface pour les spécifications client
interface ClientSpecs {
  phone?: string;
  address?: string;
}

// Supprimer le modèle existant s'il existe
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  glpiId: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: USER_ROLES,
    default: "user",
    validate: {
      validator: function(v: string) {
        return USER_ROLES.includes(v as UserRole);
      },
      message: (props: { value: string }) => `${props.value} n'est pas un rôle valide. Les rôles valides sont: ${USER_ROLES.join(', ')}`
    }
  },
  // Spécifications spécifiques au rôle
  specs: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  companies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  }],
  selectedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },
  createdAt: { type: Date, default: Date.now }
});

// Middleware pour valider les spécifications selon le rôle
UserSchema.pre("save", function(next) {
  if (this.role === "client") {
    const clientSpecs = this.specs.get("client") as ClientSpecs;
    if (!clientSpecs) {
      this.specs.set("client", {});
    }
  }
  next();
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await argon2.hash(this.password);
  next();
});

// Middleware pour s'assurer que selectedCompany est dans la liste des companies
UserSchema.pre("save", function(next) {
  if (this.selectedCompany && !this.companies.includes(this.selectedCompany)) {
    this.companies.push(this.selectedCompany);
  }
  next();
});

export const User = mongoose.model("User", UserSchema);
export type { UserRole, ClientSpecs };
