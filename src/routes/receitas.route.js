import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario 
} from '../controllers/receitas.controller.js';

const router = express.Router();

router.get("/", (req, res) => res.json({ status: "Rodando! 🚀" }));
router.get('/historico/:whatsapp', obterHistorico);
router.post('/perguntar', perguntaReceita);
router.post('/tornar-vip', tornarVip);
router.get('/usuarios/:whatsapp', obterDadosUsuario);

export default router;