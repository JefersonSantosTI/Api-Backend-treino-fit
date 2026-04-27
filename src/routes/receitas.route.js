import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario,
  gerarTreinoIA 
} from '../controllers/receitas.controller.js';

const router = express.Router();

// O prefixo "/api" já vem do server.js, então aqui você define o resto:

// 1. CHAT (URL final: /api/receitas/perguntar)
router.post('/receitas/perguntar', perguntaReceita);

// 2. HISTÓRICO (URL final: /api/receitas/historico/:whatsapp)
router.get('/receitas/historico/:whatsapp', obterHistorico);

// 3. DADOS (URL final: /api/usuarios/:whatsapp)
// CUIDADO: Se você já definiu esta rota no server.js, apague uma das duas!
router.get('/usuarios/:whatsapp', obterDadosUsuario);

// 4. VIP e TREINO
router.post('/usuarios/ativar-vip', tornarVip);
router.post('/usuarios/gerar-treino-ia', gerarTreinoIA); 

export default router;