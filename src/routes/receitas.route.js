import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario 
} from '../controllers/receitas.controller.js';

const router = express.Router();

// O prefixo "/api" já vem do server.js, então aqui completamos o caminho:

// 1. Rotas de Chat (Caminho final: /api/receitas/...)
router.post('/receitas/perguntar', perguntaReceita);
router.get('/receitas/historico/:whatsapp', obterHistorico);

// 2. Rotas de Usuário (Caminho final: /api/usuarios/...)
router.get('/usuarios/:whatsapp', obterDadosUsuario);
router.post('/usuarios/ativar-vip', tornarVip); // Nome batendo com o seu App.js

export default router;