import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario,
  gerarTreinoIA 
} from '../controllers/receitas.controller.js';

const router = express.Router();

// --- 1. INTELIGÊNCIA NUTRICIONAL & CHAT ---
// Rota para o Nutricionista/Receitas
router.post('/receitas/perguntar', perguntaReceita);
// Histórico de conversas para manter o contexto
router.get('/receitas/historico/:whatsapp', obterHistorico);

// --- 2. GESTÃO DE USUÁRIO & PERFIL ---
// Rota que o App.js usa para "pescar" os dados (Peso, Altura, IMC, Nome)
router.get('/usuarios/:whatsapp', obterDadosUsuario);
// Rota para upgrade de conta
router.post('/usuarios/ativar-vip', tornarVip);

// --- 3. MENTOR IA (TREINOS DE ALTA PERFORMANCE) ---
/**
 * Rota: POST /usuarios/gerar-treino-ia
 * Objetivo: Recebe Objetivo + Perfil Completo (IMC/TMB) 
 * para gerar o JSON de treino com técnicas avançadas.
 */
router.post('/usuarios/gerar-treino-ia', gerarTreinoIA); 

export default router;