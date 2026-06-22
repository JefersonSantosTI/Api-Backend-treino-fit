import express from 'express';
import * as landingController from '../controllers/landingController.js';

const router = express.Router();

// Rota principal: Quando o usuário clica no seu link principal
router.get('/', landingController.renderHome);

// Rota do botão de ação de login rápido via WhatsApp
router.get('/auth/whatsapp', landingController.handleWhatsAppAuth);

export default router;