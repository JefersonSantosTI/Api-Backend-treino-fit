import express from 'express';
// Importe a nova função obterHistorico aqui!
import { perguntaReceita, tornarVip, obterHistorico } from '../controllers/receitas.controller.js';

const router = express.Router();

// Rota padrão para teste
router.get("/", (req, res) => {
  res.json({ status: "Rota receitas ativa 🚀" });
});

// --- ESTA É A LINHA QUE RESOLVE O ERRO 404 DO F12 ---
// Ela diz: "Quando pedirem o histórico do whatsapp X, use a função obterHistorico"
router.get('/historico/:whatsapp', obterHistorico);

// Rota para fazer a pergunta para a IA
router.post('/perguntar', perguntaReceita);

// Rota para mudar o status do usuário para VIP
router.post('/tornar-vip', tornarVip);

export default router;