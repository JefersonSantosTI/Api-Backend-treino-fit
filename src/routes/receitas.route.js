import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario // <--- ADICIONADO AQUI
} from '../controllers/receitas.controller.js';

const router = express.Router();

// 1. Rota de Teste
router.get("/", (req, res) => {
  res.json({ status: "Servidor Treino Fit Rodando! 🚀" });
});

// 2. Rota do Histórico
router.get('/historico/:whatsapp', obterHistorico);

// 3. Rota de Chat (Onde a IA responde)
router.post('/perguntar', perguntaReceita);

// 4. Rota VIP
router.post('/tornar-vip', tornarVip);

// 5. NOVA ROTA: Busca dados do perfil para a Home
// Essa rota responde ao fetch do Front-end: /api/usuarios/SEU_NUMERO
router.get('/usuarios/:whatsapp', obterDadosUsuario);

export default router;