import { Router } from 'express';
import {
  obterAlunosAssessoria,
  loginAluno,
  prescreverTreino,
  registrarCheckin,
  atualizarStatusConta,
  deletarAluno
} from '../controllers/aluno.controller.js';

const router = Router();

// Rotas do Módulo Personal
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Rotas do Módulo Aluno
router.get('/aluno/login', loginAluno);
router.post('/aluno/:id/checkin', registrarCheckin);

export default router;