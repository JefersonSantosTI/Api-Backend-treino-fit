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

// ... suas outras rotas
router.get('/usuarios/:whatsapp', obterDadosUsuario);
router.post('/usuarios/ativar-vip', tornarVip);

// ADICIONE ESTA LINHA ABAIXO PARA MATAR O ERRO 404
router.post('/usuarios/gerar-treino-ia', obterDadosUsuario);

// ... suas outras rotas

// 2. Rotas de Usuário
router.get('/usuarios/:whatsapp', obterDadosUsuario);
router.post('/usuarios/ativar-vip', tornarVip);

// --- ADICIONE ESTAS DUAS LINHAS ABAIXO ---
router.post('/usuarios/atualizar-perfil', perguntaReceita); // Reutiliza a lógica de salvar perfil
router.post('/usuarios/gerar-treino-ia', perguntaReceita);   // Reutiliza a lógica de gerar treino via IA

export default router;