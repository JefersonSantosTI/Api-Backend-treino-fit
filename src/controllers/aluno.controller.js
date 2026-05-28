import Aluno from '../controllers/Aluno.js';
import obterRespostaReceitas from '../services/openai.service.js'; // ✅ Importando a nossa IA Inteligente

// ✅ 1. Função para o Personal Cadastrar o Aluno manualmente (sem IA)
export const criarAluno = async (req, res) => {
  try {
    const { nome, whatsapp, objetivo } = req.body;
    
    if (!nome || !whatsapp) {
      return res.status(400).json({ mensagem: 'Nome e WhatsApp são obrigatórios.' });
    }

    const existe = await Aluno.findOne({ whatsapp });
    if (existe) {
      return res.status(400).json({ mensagem: 'Este WhatsApp já está cadastrado na assessoria.' });
    }

    const novoAluno = new Aluno({ 
      nome, 
      whatsapp, 
      objetivo: objetivo || 'Emagrecimento',
      statusTreino: 'Pendente',
      statusConta: 'Ativo',
      treinoPrescrito: [],
      dietaPrescrita: [],
      checkins: []
    });
    
    await novoAluno.save();
    res.status(201).json(novoAluno);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar aluno.', erro: error.message });
  }
};

// 2. Buscar todos os alunos (Módulo Treinador)
export const obterAlunosAssessoria = async (req, res) => {
  try {
    const alunos = await Aluno.find().sort({ updatedAt: -1 });
    res.status(200).json(alunos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar alunos.', erro: error.message });
  }
};

// 3. Login do Aluno pelo Nome (Módulo Aluno)
export const loginAluno = async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome) return res.status(400).json({ mensagem: 'Parâmetro nome é obrigatório.' });

    const aluno = await Aluno.findOne({ nome: { $regex: new RegExp(`^${nome}$`, 'i') } });
    
    if (!aluno) return res.status(404).json({ mensagem: 'Aluno não encontrado.' });
    res.status(200).json(aluno);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro no login do aluno.', erro: error.message });
  }
};

// 4. Prescrever Treino e Dieta (Personal monta e envia)
export const prescreverTreino = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ Agora o painel do Personal envia Treino E Dieta
    const { treinoPrescrito, dietaPrescrita } = req.body; 

    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      id,
      { 
        treinoPrescrito, 
        dietaPrescrita, // ✅ Salvando a Dieta editada pelo Personal
        statusTreino: 'Enviado' 
      },
      { new: true }
    );

    if (!alunoAtualizado) return res.status(404).json({ mensagem: 'Aluno não encontrado.' });
    res.status(200).json(alunoAtualizado);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao salvar plano.', erro: error.message });
  }
};

// 5. Registrar Check-in (Aluno confirma que treinou)
export const registrarCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, diaSemana } = req.body;

    const aluno = await Aluno.findById(id);
    if (!aluno) return res.status(404).json({ mensagem: 'Aluno não encontrado.' });

    const jaFezCheckin = aluno.checkins.some(c => c.data === data);
    if (jaFezCheckin) return res.status(400).json({ mensagem: 'Check-in de hoje já realizado.' });

    aluno.checkins.unshift({ data, diaSemana });
    await aluno.save();

    res.status(200).json(aluno);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao registrar check-in.', erro: error.message });
  }
};

// 6. Atualizar Status da Conta (Ativar/Arquivar Aluno)
export const atualizarStatusConta = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusConta } = req.body;

    const alunoAtualizado = await Aluno.findByIdAndUpdate(id, { statusConta }, { new: true });
    if (!alunoAtualizado) return res.status(404).json({ imagen: 'Aluno não encontrado.' });

    res.status(200).json(alunoAtualizado);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar status.', erro: error.message });
  }
};

// 7. Deletar Aluno
export const deletarAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const alunoDeletado = await Aluno.findByIdAndDelete(id);
    if (!alunoDeletado) return res.status(404).json({ mensagem: 'Aluno não encontrado.' });

    res.status(200).json({ mensagem: 'Aluno removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao deletar aluno.', erro: error.message });
  }
};

// ✅ 8. A MÁGICA: Matrícula via Link com a IA trabalhando nos bastidores
export const matricularViaLinkIA = async (req, res) => {
  try {
    const { nome, whatsapp, peso, altura, idade, genero, objetivo, personalRef } = req.body;

    if (!nome || !whatsapp) {
      return res.status(400).json({ mensagem: "Nome e WhatsApp são obrigatórios." });
    }

    const existe = await Aluno.findOne({ whatsapp });
    if (existe) {
      return res.status(400).json({ mensagem: "Este WhatsApp já possui cadastro." });
    }

    // Aciona a IA passando a flag "personal_ia" para receber o JSON limpo
    const promptFake = [{ role: "user", content: `Monte o plano completo para o aluno ${nome}.` }];
    const dadosParaIA = { nome, peso, altura, idade, meta: objetivo };
    
    // A IA devolve um objeto { treino: [...], dieta: [...] }
    const planoGerado = await obterRespostaReceitas(promptFake, dadosParaIA, "personal_ia");

    // Salva o aluno já com as sugestões da IA preenchidas!
    const novoAluno = new Aluno({
      nome, 
      whatsapp, 
      objetivo: objetivo || 'Emagrecimento',
      statusTreino: 'Rascunho IA', // Balãozinho laranja de alerta para o Personal!
      statusConta: 'Ativo',
      treinoPrescrito: planoGerado.treino || [], 
      dietaPrescrita: planoGerado.dieta || [], 
      checkins: []
    });

    await novoAluno.save();
    res.status(201).json({ mensagem: "Análise da IA concluída!", aluno: novoAluno });

  } catch (error) {
    console.error("Erro na Matrícula IA:", error);
    res.status(500).json({ mensagem: "Erro interno da IA ao processar dados corporais.", erro: error.message });
  }
};