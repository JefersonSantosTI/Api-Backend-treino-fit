import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario,
  gerarTreinoIA,
  webhookKiwify,
  atualizarDadosOnboarding // Adicionei esta para o onboarding
} from '../controllers/receitas.controller.js';

const router = express.Router();

// 1. CHAT (URL final: /api/receitas/perguntar)
router.post('/receitas/perguntar', perguntaReceita);

// 2. HISTÓRICO (URL final: /api/receitas/historico/:whatsapp)
router.get('/receitas/historico/:whatsapp', obterHistorico);

// 3. DADOS (URL final: /api/usuarios/:whatsapp)
router.get('/usuarios/:whatsapp', obterDadosUsuario);

// 4. ONBOARDING (URL final: /api/usuarios/atualizar)
router.post('/usuarios/atualizar', atualizarDadosOnboarding);

// 5. VIP e TREINO
router.post('/usuarios/ativar-vip', tornarVip);
router.post('/usuarios/gerar-treino-ia', gerarTreinoIA);

// 6. WEBHOOK KIWIFY (URL final: /api/webhook-kiwify)
router.post('/webhook-kiwify', webhookKiwify);

export default router;