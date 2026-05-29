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

// ✅ MÓDULO ALUNO: Rota de login movida para o topo para sanar erros de correspondência (404)
router.get('/aluno/login', loginAluno);

// ✅ Rota para o Personal cadastrar o aluno manualmente
router.post('/aluno', criarAluno);

// ✅ Rota para o formulário do link de Auto-Cadastro com IA e Anamnese de Elite
router.post('/aluno/matricula-ia', matricularViaLinkIA); 

// Rotas do Módulo Personal
router.get('/personal/alunos', obterAlunosAssessoria);
router.post('/aluno/:id/prescrever', prescreverTreino);
router.put('/aluno/:id/status', atualizarStatusConta);
router.delete('/aluno/:id', deletarAluno);

// Sincronização do painel do aluno
router.post('/aluno/:id/checkin', registrarCheckin);

// ✅ APENAS UM EXPORT NO FINAL DO ARQUIVO
export default router;