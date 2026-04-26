import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario,
  gerarTreinoIA // <--- Vamos criar esta função agora
} from '../controllers/receitas.controller.js';

const router = express.Router();

// 1. Rotas de Chat / Nutrição
router.post('/receitas/perguntar', perguntaReceita);
router.get('/receitas/historico/:whatsapp', obterHistorico);

// 2. Rotas de Usuário
router.get('/usuarios/:whatsapp', obterDadosUsuario);
router.post('/usuarios/ativar-vip', tornarVip);

// 3. Rota de Treino IA (Exclusiva para os Cards)
// Mudamos de obterDadosUsuario para gerarTreinoIA
router.post('/usuarios/gerar-treino-ia', gerarTreinoIA); 

export default router;