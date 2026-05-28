import { Router } from 'express';
import {
  criarAluno,
  obterAlunosAssessoria,
  loginAluno,
  prescreverTreino,
  registrarCheckin,
  atualizarStatusConta,
  deletarAluno,
  matricularViaLinkIA // 👈 1. Importe a função nova aqui
} from '../controllers/aluno.controller.js';

const router = Router();

router.post('/aluno', criarAluno);

// 👈 2. Adicione esta Rota NOVA para o formulário do link
router.post('/aluno/matricula-ia', matricularViaLinkIA); 

// ... (mantenha o resto das rotas que já lá estão)
export default router;

// ✅ ADICIONADO: Rota para o Personal cadastrar o aluno
router.post('/aluno', criarAluno);

// Rotas do Módulo Personal
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Rotas do Módulo Aluno
router.get('/aluno/login', loginAluno);
router.post('/aluno/:id/checkin', registrarCheckin);

export default router;