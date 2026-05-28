import express from 'express';
import { 
  perguntaReceita, 
  tornarVip, 
  obterHistorico, 
  obterDadosUsuario,
  gerarTreinoIA,
  webhookKiwify,
  atualizarDadosOnboarding 
} from '../controllers/receitas.controller.js';

// Importação das novas rotas do ecossistema Personal
import { 
  loginGooglePersonal, 
  listarAlunosDoPersonal, 
  onboardingAlunoDoPersonal, 
  aprovarTreinoEDietaDoPersonal 
} from '../controllers/personal.controller.js';

const router = express.Router();

// ==========================================
// 🚀 ROTAS ATUAIS (MANTIDAS 100% INTATAS)
// ==========================================
router.post('/receitas/perguntar', perguntaReceita);
router.get('/receitas/historico/:whatsapp', obterHistorico);
router.get('/usuarios/:whatsapp', obterDadosUsuario);
router.post('/usuarios/atualizar', atualizarDadosOnboarding);
router.post('/usuarios/ativar-vip', tornarVip);
router.post('/usuarios/gerar-treino-ia', gerarTreinoIA);
router.post('/webhook-kiwify', webhookKiwify);

// ==========================================
// 🎛️ NOVAS ROTAS PORTAL PERSONAL & ALUNO (ESTILO MFIT)
// ==========================================

// Autenticação e painel do Personal
router.post('/personal/auth-google', loginGooglePersonal);
router.get('/personal/:personalId/alunos', listarAlunosDoPersonal);

// Cadastro de Aluno vindo do link do Personal e Aprovação do Treino
router.post('/personal/aluno-onboarding', onboardingAlunoDoPersonal);
router.post('/personal/aprovar-plano', aprovarTreinoEDietaDoPersonal);

export default router;