import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth';
import { Buffer } from 'buffer';
import { Company } from '../models/Company';
import mongoose from 'mongoose';

const router = express.Router();

const GLPI_API_URL = process.env.GLPI_API_URL; 
const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN;
const GLPI_USERNAME = process.env.GLPI_USERNAME;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD;

interface TicketData {
  title: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryType: 'client' | 'technician' | 'imp360';
  company?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}

// Ajout de l'interface pour l'utilisateur
interface AuthenticatedUser {
  _id: string;
  glpiId: string;
  role: string;
  company?: string;
  selectedCompany: mongoose.Types.ObjectId;
}

router.post('/ticket', authMiddleware, async (req, res) => {
  const ticketData: TicketData = req.body;
  const user = req.user as AuthenticatedUser;
  let company;

  try {
    if (!user.glpiId) {
      return res.status(400).json({ error: 'ID GLPI de l\'utilisateur non trouvé' });
    }

    if (!user.selectedCompany) {
      return res.status(400).json({ error: 'Entreprise sélectionnée non trouvée' });
    }

    // Récupération des informations complètes de l'entreprise
    company = await Company.findById(user.selectedCompany);
    if (!company) {
      return res.status(400).json({ error: 'Entreprise non trouvée dans la base de données' });
    }

    if (!ticketData.items || !ticketData.total) {
      return res.status(400).json({ error: 'Données du ticket invalides' });
    }

    const getDeliveryTypeText = (type: string) => {
      switch (type) {
        case 'client':
          return 'Envoi chez le client';
        case 'technician':
          return 'Envoi chez le technicien';
        case 'imp360':
          return 'Envoi chez IMP360';
        default:
          return 'Mode de livraison non spécifié';
      }
    };

    const ticketContent = `
Informations du client :
Nom et Prénom : ${ticketData.clientName}
Téléphone : ${ticketData.clientPhone}
Email : ${ticketData.clientEmail}

Commande de produits :
${ticketData.items.map(item => 
  `- ${item.name} (${item.quantity} × ${item.price}€)`
).join('\n')}

Total de la commande : ${ticketData.total.toFixed(2)}€
${ticketData.company ? `\nEntreprise : ${ticketData.company}` : ''}
Mode de livraison : ${getDeliveryTypeText(ticketData.deliveryType)}
    `.trim();

    const credentials = Buffer.from(`${GLPI_USERNAME}:${GLPI_PASSWORD}`).toString('base64');
    const sessionResponse = await axios.get(`${GLPI_API_URL}/initSession`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'App-Token': GLPI_APP_TOKEN
      }
    });

    const sessionToken = sessionResponse.data.session_token;

    const glpiResponse = await axios.post(
      `${GLPI_API_URL}/Ticket`,
      {
        input: {
          name: ticketData.title,
          content: ticketContent,
          entities_id: parseInt(company.glpiId),
          type: 2,
          status: 2,
          priority: 3,
          itilcategories_id: 20
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Session-Token': sessionToken,
          'App-Token': GLPI_APP_TOKEN
        }
      }
    );

    const ticketId = glpiResponse.data.id;

    await axios.put(`${GLPI_API_URL}/Ticket/${ticketId}`, {
      input: {
        _groups_id_assign: 16
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Session-Token': sessionToken,
        'App-Token': GLPI_APP_TOKEN
      }
    });

    await axios.post(`${GLPI_API_URL}/Ticket_User`, {
      input: {
        tickets_id: ticketId,
        users_id: user.glpiId,
        type: 1
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Session-Token': sessionToken,
        'App-Token': GLPI_APP_TOKEN
      }
    });

    await axios.get(`${GLPI_API_URL}/killSession`, {
      headers: {
        'Content-Type': 'application/json',
        'Session-Token': sessionToken,
        'App-Token': GLPI_APP_TOKEN
      }
    });

    res.status(201).json({
      message: 'Ticket créé avec succès',
      ticketId
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Détails de l\'erreur GLPI:', {
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      return res.status(error.response?.status || 500).json({
        error: 'Erreur lors de la création du ticket GLPI',
        details: error.response?.data || error.message,
        requestData: {
          entities_id: company?.glpiId,
          title: ticketData.title
        }
      });
    }

    console.error('Erreur non-Axios:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

router.post('/test', authMiddleware, async (req, res) => {
  try {
    const credentials = Buffer.from(`${GLPI_USERNAME}:${GLPI_PASSWORD}`).toString('base64');
    
    const sessionResponse = await axios.get(`${GLPI_API_URL}/initSession`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'App-Token': GLPI_APP_TOKEN
      }
    });

    const sessionToken = sessionResponse.data.session_token;

    const ticketGroupsResponse = await axios.get(`${GLPI_API_URL}/Ticket_Group`, {
      headers: {
        'Content-Type': 'application/json',
        'Session-Token': sessionToken,
        'App-Token': GLPI_APP_TOKEN
      }
    });

    await axios.get(`${GLPI_API_URL}/killSession`, {
      headers: {
        'Content-Type': 'application/json',
        'Session-Token': sessionToken,
        'App-Token': GLPI_APP_TOKEN
      }
    });

    res.status(200).json({
      message: 'Groupes de tickets récupérés avec succès',
      groups: ticketGroupsResponse.data
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'Erreur lors de la récupération des groupes de tickets GLPI',
        details: error.response?.data || error.message
      });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
