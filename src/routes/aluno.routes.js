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
  gerarPlanoIAPersonal // <-- 1. ADICIONADO AQUI
} from '../controllers/aluno.controller.js';
const router = Router();

// MÓDULO ALUNO
router.get('/aluno/login', loginAluno);
router.post('/aluno', criarAluno);
router.post('/aluno/matricula-ia', matricularViaLinkIA); 
router.put('/aluno/:id/atualizar-biometria', atualizarBiometria);
router.post('/aluno/:id/gerar-plano-ia-personal', gerarPlanoIAPersonal); // ✅ 2. ROTA DO BOTÃO MÁGICO CONECTADA!
router.put('/aluno/:id/agua', configurarLembreteAgua); 
router.put('/aluno/:id/salvar-assinatura', salvarAssinaturaPush);
// Adicione esta linha junto com as outras rotas de aluno:
router.post('/progressao-carga', alunoController.salvarProgressaoCarga);

// MÓDULO PERSONAL
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Sincronização e Feedbacks
router.post('/aluno/:id/checkin', registrarCheckin);
router.post('/aluno/:id/responder-checkin', responderCheckin); 

export default router;