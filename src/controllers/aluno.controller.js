import Aluno from '../controllers/Aluno.js';
import obterRespostaReceitas from '../services/openai.service.js';

export const criarAluno = async (req, res) => {
  try {
    const { nome, whatsapp, objetivo } = req.body;
    if (!nome || !whatsapp) return res.status(400).json({ mensagem: 'Nome e WhatsApp são obrigatórios.' });
    const existe = await Aluno.findOne({ whatsapp });
    if (existe) return res.status(400).json({ mensagem: 'Este WhatsApp já está cadastrado na assessoria.' });

    const novoAluno = new Aluno({ 
      nome, whatsapp, objetivo: objetivo || 'Emagrecimento', statusTreino: 'Pendente', statusConta: 'Ativo',
      treinoPrescrito: [], dietaPrescrita: [], checkins: []
    });
    await novoAluno.save();
    res.status(201).json(novoAluno);
  } catch (error) { res.status(500).json({ mensagem: 'Erro ao criar aluno.', erro: error.message }); }
};

export const obterAlunosAssessoria = async (req, res) => {
  try {
    const alunos = await Aluno.find().sort({ updatedAt: -1 });
    res.status(200).json(alunos);
  } catch (error) { res.status(500).json({ message: 'Erro.', erro: error.message }); }
};

export const loginAluno = async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome) return res.status(400).json({ mensagem: 'Parâmetro obrigatório.' });
    const aluno = await Aluno.findOne({ nome: { $regex: new RegExp(`^${nome.trim()}$`, 'i') } });
    if (!aluno) return res.status(404).json({ mensagem: 'Não encontrado.' });
    res.status(200).json(aluno);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

export const prescreverTreino = async (req, res) => {
  try {
    const { id } = req.params;
    const { treinoSemanal, dietaPrescrita, metaAgua } = req.body; 
    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      id,
      { treinoSemanal, dietaPrescrita, metaAgua, statusTreino: 'Enviado' },
      { new: true }
    );
    if (!alunoAtualizado) return res.status(404).json({ mensagem: 'Não encontrado.' });
    res.status(200).json(alunoAtualizado);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

export const registrarCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, diaSemana } = req.body;
    const aluno = await Aluno.findById(id);
    if (!aluno) return res.status(404).json({ window: 'Não encontrado.' });
    const jaFezCheckin = aluno.checkins.some(c => c.data === data);
    if (jaFezCheckin) return res.status(400).json({ mensagem: 'Check-in já realizado.' });

    aluno.checkins.unshift({ data, diaSemana });
    await aluno.save();
    res.status(200).json(aluno);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

export const atualizarStatusConta = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusConta } = req.body;
    const alunoAtualizado = await Aluno.findByIdAndUpdate(id, { statusConta }, { new: true });
    res.status(200).json(alunoAtualizado);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

export const deletarAluno = async (req, res) => {
  try {
    const { id } = req.params;
    await Aluno.findByIdAndDelete(id);
    res.status(200).json({ mensagem: 'Removido.' });
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

// ✅ ATUALIZADO: Processando a Anamnese de Elite Completa vinda do Link da IA
export const matricularViaLinkIA = async (req, res) => {
  try {
    const { nome, whatsapp, peso, altura, idade, genero, objetivo, nivel, diasTreino, restricoes, lesoes } = req.body;
    if (!nome || !whatsapp) return res.status(400).json({ mensagem: "Obrigatório." });
    const existe = await Aluno.findOne({ whatsapp });
    if (existe) return res.status(400).json({ mensagem: "Já possui cadastro." });

    const promptFake = [{ role: "user", content: `Monte o plano completo para o aluno ${nome}.` }];
    
    // Injetando os novos parâmetros estruturados na IA Core do Treino Fit
    const dadosParaIA = { nome, peso, altura, idade, meta: objetivo, genero, nivel, diasTreino, restricoes, lesoes };
    
    // O motor gera a estrutura robusta: { treinoSemanal, dieta, agua }
    const planoGerado = await obterRespostaReceitas(promptFake, dadosParaIA, "personal_ia");

    const novoAluno = new Aluno({
      nome, whatsapp, objetivo: objetivo || 'Emagrecimento', statusTreino: 'Rascunho IA', statusConta: 'Ativo',
      treinoSemanal: planoGerado.treinoSemanal || [], 
      dietaPrescrita: planoGerado.dieta || [], 
      metaAgua: planoGerado.agua || 'Calculando...',
      checkins: [],
      // Preservando os dados preenchidos no banco de dados para o Personal ler na planilha
      genero, nivel, diasTreino, restricoes, lesoes, peso, altura, idade
    });
    
    await novoAluno.save();
    res.status(201).json({ mensagem: "Concluído!", aluno: novoAluno });
  } catch (error) { res.status(500).json({ erro: error.message }); }
};