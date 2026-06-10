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
  responderCheckin // ✅ IMPORTADO AQUI
} from '../controllers/aluno.controller.js';

const router = Router();

// MÓDULO ALUNO
router.get('/aluno/login', loginAluno);
router.post('/aluno', criarAluno);
router.post('/aluno/matricula-ia', matricularViaLinkIA); 
router.put('/aluno/:id/atualizar-biometria', atualizarBiometria);

// MÓDULO PERSONAL
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Sincronização e Feedbacks
router.post('/aluno/:id/checkin', registrarCheckin);
router.post('/aluno/:id/responder-checkin', responderCheckin); // ✅ ROTA PARA O FEEDBACK DO PERSONAL

export default router;