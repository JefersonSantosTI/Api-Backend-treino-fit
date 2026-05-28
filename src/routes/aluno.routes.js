import { Router } from 'express';
import {
  criarAluno, // ✅ ADICIONADO: Importando a função de criar
  obterAlunosAssessoria,
  loginAluno,
  prescreverTreino,
  registrarCheckin,
  atualizarStatusConta,
  deletarAluno
} from '../controllers/aluno.controller.js';

const router = Router();

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