import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { Product } from "../models/Product";

interface Specs {
  racks?: string;
  poe?: string;
  poePower?: string;
  alim?: string;
  cable?: string;
}

interface ProductEntry {
  gn: boolean;
  sku: string;
  name: string;
  brand: string;
  type: string;
  model?: string;
  description: string;
  description2?: string;
  price?: number | string;
  pricet1?: number;
  pricet2?: number;
  pricet3?: number | string;
  role: string;
  image: string;
  guarantee: string;
  specs: Specs;
}

function cleanString(value: any): string {
  if (value === null || value === undefined) return "";
  return value
    .toString()
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findImageForSku(sku: string): string {
  const uploadsDir = path.resolve(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) return `https://catalogue-imp360-server.onrender.com/uploads/${sku.toLowerCase()}.jpg`;

  const files = fs.readdirSync(uploadsDir);
  const skuLower = sku.toLowerCase();

  const matchingFile = files.find((file) => {
    const fileNameWithoutExt = path.parse(file).name.toLowerCase();
    return fileNameWithoutExt === skuLower;
  });

  if (matchingFile) {
    const extension = path.extname(matchingFile);
    return `https://catalogue-imp360-server.onrender.com/uploads/${skuLower}${extension}`;
  }

  return `https://catalogue-imp360-server.onrender.com/uploads/${skuLower}.jpg`;
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeSheetName(name: string): string {
  return removeAccents(name).toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function importExcelSheet(sheetName: string) {
  const filePath = path.resolve(__dirname, "../../data/bdd.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`La feuille "${sheetName}" est introuvable.`);
  }

  const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

  const rows = rawRows.map((row) => {
    const cleanedRow: Record<string, any> = {};
    for (const key in row) {
      const cleanedKey = key
        .toString()
        .replace(/[\n\r\t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      cleanedRow[cleanedKey] = row[key];
    }
    return cleanedRow;
  });

  const normalizedSheet = normalizeSheetName(sheetName);
  console.log("Import de la feuille:", sheetName, "->", normalizedSheet);

  for (const row of rows) {
    const sku = (row["sku"] || row["code article"])?.toString().trim();
    if (!sku) {
      console.warn("Ligne ignorée : SKU manquant");
      continue;
    }

    let role = "";
    let specs: any = {};

    switch (normalizedSheet) {
      case "reseaux- nas":
        role = "réseaux - nas";
        specs = {
          racks: cleanString(row["nombre de ports/ baies"]),
          poe: cleanString(row["poe"]) || "non",
          poePower: cleanString(row["puissance poe"]) || "0 W",
          alim: cleanString(row["alim externe"])?.toLowerCase() || "non",
        };
        break;
      case "accessoires":
        role = "accessoires";
        specs = {
          cable: cleanString(row["cordon inclus"]),
        };
        break;
      case "pc":
        role = "ordinateurs";
        specs = {
          cpu: cleanString(row["processeur"]),
          cputype: cleanString(row["version du processeur"]),
          ram: cleanString(row["mémoire"]),
          stockage: cleanString(row["stockage"]),
          gpu: cleanString(row["carte graphique"]),
          screen: cleanString(row["ecran"]),
          network: cleanString(row["reseaux"]),
          burner: cleanString(row["graveur dvi"]),
          connections: cleanString(row["connexions"]),
          alim: cleanString(row["alim externe"]),
          os: cleanString(row["os"]),
        };
        break;
      case "ecrans":
        role = "écrans";
        specs = {
          displaysize: cleanString(row["taille diagonale"]),
          connections: cleanString(row["connexions"]),
          resolution: cleanString(row["resolution"]),
          contrast: cleanString(row["taux de contraste"]),
          medicalCE: cleanString(row["ce medical"]),
          support: cleanString(row["type de support"]),
          cord: cleanString(row["cordon inclus"]),
          captor: cleanString(row["capteur / sonde"]),
        };
        break;
      case "robot epson":
        role = "robot epson";
        specs = {
          cable: cleanString(row["cordon inclus"]),
        };
        break;
      case "onduleurs":
        role = "onduleurs";
        specs = {
          description3: cleanString(row["commentaires 3"]),
        };
        break;
      case "imprimantes & scanners":
        role = "imprimantes & scanners";
        specs = {
          rectoverso: cleanString(row["recto - verso"]),
          charger: cleanString(row["chargeur"]),
          norm: cleanString(row["norme"]),
          cable: cleanString(row["type de connecteur"]),
          cord: cleanString(row["cordon inclus"]),
          optionbac: cleanString(row["option bac sup"]),
          alim: cleanString(row["alim externe"]),
        };
        break;
      case "cables":
        role = "câbles";
        specs = {
          type: cleanString(row["type"]),
          cord: cleanString(row["cordon inclus"]),
          norme: cleanString(row["norme"]),
          longueur: cleanString(row["longueur"]),
          connecteur: cleanString(row["type de connecteur"]),
        };
        break;
      case "telephone ip":
        role = "téléphone ip";
        specs = {
          alim: cleanString(row["alim externe"]),
          description2: cleanString(row["commentaires 2"]) || cleanString(row[""]),
        };
        break;
      case "occasions":
        role = "occasions";
        specs = {
          description3: cleanString(row["commentaires 3"]),
        };
        break;
      case "logiciels":
        role = "logiciels";
        specs = {
          description2: cleanString(row["commentaires 2"]) || cleanString(row[""]),
        };
        break;
      default:
        role = cleanString(row["role"]) || normalizedSheet;
        specs = {};
    }

    // Sécurité : on ne laisse jamais le champ role vide
    if (!role) {
      role = normalizedSheet;
    }

    const pricet3Value = row["prix de vente €ht t3 -5,0%"];
    const pricet3Parsed = Math.round(parseFloat(pricet3Value));
    const pricet2Value = row["prix de vente €ht t2 -2,5%"];
    const pricet2Parsed = Math.round(parseFloat(pricet2Value));

    const product: ProductEntry = {
      gn: cleanString(row["gn ou hg"]).toUpperCase() === "GN",
      sku: cleanString(sku),
      name: cleanString(row["reference"]),
      brand: cleanString(row["marque"]),
      type: cleanString(row["type"]),
      model: cleanString(row["model"]),
      description: cleanString(row["commentaires 1"]),
      description2: cleanString(row["commentaires 2"]),
      price: isNaN(parseFloat(row["pa €ht"])) ? undefined : parseFloat(row["pa €ht"]),
      pricet1: isNaN(parseFloat(row["prix de vente €ht t1"])) ? undefined : parseFloat(row["prix de vente €ht t1"]),
      pricet2: isNaN(parseFloat(pricet2Value)) ? undefined : pricet2Parsed,
      pricet3: isNaN(parseFloat(pricet3Value)) ? undefined : pricet3Parsed,
      role,
      image: findImageForSku(sku),
      guarantee: cleanString(row["garantie"]) || "1 an",
      specs,
    };

    await Product.findOneAndUpdate({ sku: product.sku }, product, {
      upsert: true,
      new: true,
    });
  }

  console.log(`✅ Import terminé depuis la feuille "${sheetName}"`);
}

export async function importAllSheets() {
  const sheets = [
    "RESEAUX- NAS",
    "ACCESSOIRES",
    "PC",
    "ECRANS",
    "ROBOT EPSON",
    "ONDULEURS",
    "IMPRIMANTES & SCANNERS",
    "CABLES",
    "TELEPHONE IP",
    "OCCASIONS",
    "LOGICIELS",
  ];

  for (const sheet of sheets) {
    try {
      await importExcelSheet(sheet);
    } catch (err) {
      console.error(`Erreur lors de l'import de la feuille "${sheet}" :`, err);
    }
  }
  console.log("✅ Import de toutes les feuilles terminé !");
}