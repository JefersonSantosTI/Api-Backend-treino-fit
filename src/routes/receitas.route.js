import express from 'express';
import { perguntaReceita, tornarVip, obterHistorico } from '../controllers/receitas.controller.js';

const router = express.Router();

// 1. Rota de Teste (Para ver se o servidor está online)
router.get("/", (req, res) => {
  res.json({ status: "Servidor Treino Fit Rodando! 🚀" });
});

// 2. Rota do Histórico (Para carregar as mensagens antigas)
// Certifique-se que o Front chama: /api/receitas/historico/SEU_NUMERO
router.get('/historico/:whatsapp', obterHistorico);

// 3. Rota de Chat (Onde a IA responde)
// Certifique-se que o Front chama: /api/receitas/perguntar
router.post('/perguntar', perguntaReceita);

// 4. Rota VIP (Onde o código TREINOFIT2026 ativa o plano)
// IMPORTANTE: Se o Front chamar /tornarVip (sem hífen), mude aqui também!
// Recomendo usar 'tornar-vip' conforme abaixo:
router.post('/tornar-vip', tornarVip);

export default router;