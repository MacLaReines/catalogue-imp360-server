import express from 'express';
import { Product } from '../models/Product';
import { networkInterfaces } from 'os';

const router = express.Router();

// Endpoint de recherche
router.get('/products/search', async (req, res) => {
  try {
    const searchQuery = req.query.q as string;
    if (!searchQuery) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const regex = new RegExp(searchQuery, 'i');
    const products = await Product.find({
      $or: [
        { name: regex },
        { description: regex },
        { brand: regex },
        { model: regex },
        { type: regex }
      ]
    }).limit(10);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la recherche', error: err });
  }
});

router.post('/products', async (req, res) => {
  try {
    const {
      name,
      sku,
      brand,
      gn,
      type,
      model,
      description,
      description2,
      price,
      pricet1,
      pricet2,
      pricet3,
      guarantee,
      image,
      role,
      specs
    } = req.body;

    console.log("Reçu dans req.body :", req.body);

    let validatedSpecs = {};

    switch (role) {
      case "ordinateurs":
        validatedSpecs = {
          cpu: specs.cpu,
          cputype: specs.cputype,
          ram: specs.ram,
          stockage: specs.stockage,
          gpu: specs.gpu,
          screen: specs.screen,
          network: specs.network,
          burner: specs.burner,
          connections: specs.connections,
          alim: specs.alim,
          os: specs.os,
        };
        break;

      case "ecrans":
        validatedSpecs = {
          displaySize: specs.displaysize,
          connections: specs.connections,
          medicalCE: specs.medicalCE,
          support: specs.support,
          captor: specs.captor,
          cord: specs.cord,
          resolution: specs.resolution,
          contrast: specs.contrast,
        };
        break;

      case "réseaux - nas":
        validatedSpecs = {
          racks: specs.racks,
          poe: specs.poe,
          poePower: specs.poePower,
          alim: specs.alim,
        };
        break;

      case "accesoires":
        validatedSpecs = {
          cable: specs.cable,
        };
        break;

      case "robot epson":
        validatedSpecs = {
          cable: specs.cable,
      };
      break;

      case "onduleurs":
        validatedSpecs = {
          description3: specs.description3,
      };
      break;

      case "imprimantes & scanners":
        validatedSpecs = {
          rectoverso: specs.rectoverso,
          charger: specs.charger,
          norm: specs.norm,
          cable: specs.cable,
          cord: specs. cord,
          optionbac: specs.optionbac,
          alim: specs.alim,
      };
      break;

      case "téléphone ip":
        validatedSpecs = {
          alim: specs.alim,
      };
      break;
      
      case "occasions":
        validatedSpecs = {
          description3: specs.description3,
      };
      break;

      default:
        return res.status(400).json({ message: `Rôle invalide: ${role}` });
    }

    const product = new Product({
      name,
      sku,
      brand,
      gn,
      type,
      model,
      description,
      description2,
      price,
      pricet1,
      pricet2,
      pricet3,
      guarantee,
      image,
      role,
      specs: validatedSpecs
    });
    

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création', error: err });
  }
});

router.get('/products', async (_req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement', error: err });
  }
});

router.get('/products/role/:role', async (req, res) => {
  try {
    const products = await Product.find({ role: req.params.role });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement par rôle', error: err });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération du produit', error: err });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    console.log('Mise à jour du produit - ID:', req.params.id);
    console.log('Données reçues:', req.body);

    const {
      name,
      sku,
      brand,
      gn,
      type,
      model,
      description,
      description2,
      price,
      pricet1,
      pricet2,
      pricet3,
      guarantee,
      image,
      role,
      specs
    } = req.body;

    let validatedSpecs = {};

    switch (role) {
      case "ordinateurs":
        validatedSpecs = {
          cpu: specs?.cpu,
          cputype: specs?.cputype,
          ram: specs?.ram,
          stockage: specs?.stockage,
          gpu: specs?.gpu,
          screen: specs?.screen,
          network: specs?.network,
          burner: specs?.burner,
          connections: specs?.connections,
          alim: specs?.alim,
          os: specs?.os,
        };
        break;

      case "ecrans":
        validatedSpecs = {
          displaySize: specs?.displaysize,
          connections: specs?.connections,
          medicalCE: specs?.medicalCE,
          support: specs?.support,
          captor: specs?.captor,
          cord: specs?.cord,
          resolution: specs?.resolution,
          contrast: specs?.contrast,
        };
        break;

      case "réseaux - nas":
        validatedSpecs = {
          racks: specs?.racks,
          poe: specs?.poe,
          poePower: specs?.poePower,
          alim: specs?.alim,
        };
        break;

      case "accesoires":
        validatedSpecs = {
          cable: specs?.cable,
        };
        break;

      case "robot epson":
        validatedSpecs = {
          cable: specs?.cable,
      };
      break;

      case "onduleurs":
        validatedSpecs = {
          description3: specs?.description3,
      };
      break;

      case "imprimantes & scanners":
        validatedSpecs = {
          rectoverso: specs?.rectoverso,
          charger: specs?.charger,
          norm: specs?.norm,
          cable: specs?.cable,
          cord: specs?.cord,
          optionbac: specs?.optionbac,
          alim: specs?.alim,
      };
      break;

      case "téléphone ip":
        validatedSpecs = {
          alim: specs?.alim,
      };
      break;
      
      case "occasions":
        validatedSpecs = {
          description3: specs?.description3,
      };
      break;

      default:
        return res.status(400).json({ message: `Rôle invalide: ${role}` });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        sku,
        brand,
        gn,
        type,
        model,
        description,
        description2,
        price,
        pricet1,
        pricet2,
        pricet3,
        guarantee,
        image,
        role,
        specs: validatedSpecs
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    console.log('Produit mis à jour avec succès:', updatedProduct);
    res.json(updatedProduct);
  } catch (err) {
    console.error('Erreur lors de la mise à jour:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du produit', error: err });
  }
});

export default router;
