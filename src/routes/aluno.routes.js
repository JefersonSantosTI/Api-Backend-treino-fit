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
  atualizarBiometria // ✅ 1. ADICIONADO AQUI
} from '../controllers/aluno.controller.js';

const router = Router();

// MÓDULO ALUNO
router.get('/aluno/login', loginAluno);
router.post('/aluno', criarAluno);
router.post('/aluno/matricula-ia', matricularViaLinkIA); 

// ✅ 2. A NOVA ROTA DE ATUALIZAÇÃO COM IA (ADICIONADA AQUI)
router.put('/aluno/:id/atualizar-biometria', atualizarBiometria);

// MÓDULO PERSONAL
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Sincronização do painel do aluno
router.post('/aluno/:id/checkin', registrarCheckin);

export default router;