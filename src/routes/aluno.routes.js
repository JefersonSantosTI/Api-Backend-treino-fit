import { Router } from 'express';
import {
  criarAluno,
  obterAlunosAssessoria,
  loginAluno,
  prescreverTreino,
  registrarCheckin,
  atualizarStatusConta,
  deletarAluno,
  matricularViaLinkIA,
  atualizarBiometria,
  responderCheckin,
  salvarAssinaturaPush,
  configurarLembreteAgua,
  gerarPlanoIAPersonal,
  salvarProgressaoCarga // <-- ✅ 1. IMPORTAMOS ELA AQUI!
} from '../controllers/aluno.controller.js';

const router = Router();

// MÓDULO ALUNO
router.get('/aluno/login', loginAluno);
router.post('/aluno', criarAluno);
router.post('/aluno/matricula-ia', matricularViaLinkIA); 
router.put('/aluno/:id/atualizar-biometria', atualizarBiometria);
router.post('/aluno/:id/gerar-plano-ia-personal', gerarPlanoIAPersonal); 
router.put('/aluno/:id/agua', configurarLembreteAgua); 
router.put('/aluno/:id/salvar-assinatura', salvarAssinaturaPush);

// ✅ 2. AQUI ESTÁ A ROTA NOVA DO JEITO CERTO! (Note o /aluno na frente para manter o padrão)
router.post('/aluno/progressao-carga', salvarProgressaoCarga);

// MÓDULO PERSONAL
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Sincronização e Feedbacks
router.post('/aluno/:id/checkin', registrarCheckin);
router.post('/aluno/:id/responder-checkin', responderCheckin); 

export default router;