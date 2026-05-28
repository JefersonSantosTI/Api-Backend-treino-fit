import { Router } from 'express';
import {
  criarAluno,
  obterAlunosAssessoria,
  loginAluno,
  prescreverTreino,
  registrarCheckin,
  atualizarStatusConta,
  deletarAluno,
  matricularViaLinkIA
} from '../controllers/aluno.controller.js';

const router = Router();

// ✅ Rota para o Personal cadastrar o aluno manualmente
router.post('/aluno', criarAluno);

// ✅ Rota NOVA para o formulário do link de Auto-Cadastro com IA
router.post('/aluno/matricula-ia', matricularViaLinkIA); 

// Rotas do Módulo Personal
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Rotas do Módulo Aluno
router.get('/aluno/login', loginAluno);
router.post('/aluno/:id/checkin', registrarCheckin);

// ✅ APENAS UM EXPORT AQUI NO FINAL DO ARQUIVO (Isto resolve o erro fatal!)
export default router;