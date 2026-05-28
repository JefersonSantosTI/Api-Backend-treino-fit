import Aluno from '../controllers/Aluno.js';

// ✅ NOVO: Função para o Personal Cadastrar o Aluno no banco
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
      checkins: []
    });
    
    await novoAluno.save();
    res.status(201).json(novoAluno);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar aluno.', erro: error.message });
  }
};

// 1. Buscar todos os alunos (Painel do Personal)
export const obterAlunosAssessoria = async (req, res) => {
  try {
    const alunos = await Aluno.find().sort({ updatedAt: -1 });
    res.status(200).json(alunos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar alunos.', erro: error.message });
  }
};

// 2. Login do Aluno pelo Nome
export const loginAluno = async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome) return res.status(400).json({ mensagem: 'Parâmetro nome é obrigatório.' });

    // Busca ignorando maiúsculas/minúsculas
    const aluno = await Aluno.findOne({ nome: { $regex: new RegExp(`^${nome}$`, 'i') } });
    
    if (!aluno) return res.status(404).json({ mensagem: 'Aluno não encontrado.' });
    res.status(200).json(aluno);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro no login do aluno.', erro: error.message });
  }
};

// 3. Prescrever Treino (Personal monta e envia)
export const prescreverTreino = async (req, res) => {
  try {
    const { id } = req.params;
    const { treinoPrescrito } = req.body;

    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      id,
      { 
        treinoPrescrito, 
        statusTreino: 'Enviado' 
      },
      { new: true }
    );

    if (!alunoAtualizado) return res.status(404).json({ mensagem: 'Aluno não encontrado.' });
    res.status(200).json(alunoAtualizado);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao salvar treino.', erro: error.message });
  }
};

// 4. Registrar Check-in (Aluno confirma que treinou)
export const registrarCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, diaSemana } = req.body;

    const aluno = await Aluno.findById(id);
    if (!aluno) return res.status(404).json({ mensagem: 'Aluno não encontrado.' });

    // Evita duplicidade de check-in no mesmo dia
    const jaFezCheckin = aluno.checkins.some(c => c.data === data);
    if (jaFezCheckin) return res.status(400).json({ mensagem: 'Check-in de hoje já realizado.' });

    // Adiciona o novo check-in no início do array
    aluno.checkins.unshift({ data, diaSemana });
    await aluno.save();

    res.status(200).json(aluno);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao registrar check-in.', erro: error.message });
  }
};

// 5. Atualizar Status da Conta (Ativar/Arquivar Aluno)
export const atualizarStatusConta = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusConta } = req.body;

    const alunoAtualizado = await Aluno.findByIdAndUpdate(id, { statusConta }, { new: true });
    if (!alunoAtualizado) return res.status(404).json({ imagen: 'Aluno não encontrado.' });

    res.status(200).json(alunoAtualizado);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar status da conta.', erro: error.message });
  }
};

// 6. Deletar Aluno
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

// ✅ PASSO 1: Função que recebe os dados do link e aciona a IA
export const matricularViaLinkIA = async (req, res) => {
  try {
    const { nome, whatsapp, peso, altura, idade, genero, objetivo, personalRef } = req.body;

    // 1. Validação básica
    if (!nome || !whatsapp) {
      return res.status(400).json({ mensagem: "Nome e WhatsApp são obrigatórios." });
    }

    const existe = await Aluno.findOne({ whatsapp });
    if (existe) {
      return res.status(400).json({ mensagem: "Este WhatsApp já possui cadastro." });
    }

    // 2. AQUI A MÁGICA ACONTECE (Integração com a IA)
    // Aqui você conectará a sua função de IA geradora. 
    // Por enquanto, geramos um esqueleto inteligente com base nos dados reais do aluno.
    const treinoGeradoPelaIA = [
      { nome: "Aquecimento Articular Geral", series: 1, reps: "5 min", obs: "Preparação gerada pela IA." },
      { nome: objetivo === 'Emagrecimento' ? "HIIT na Esteira" : "Agachamento com Barra", series: 4, reps: "12", obs: `Foco total em ${objetivo} para o perfil de ${peso}kg.` },
      { nome: "Prancha Abdominal", series: 3, reps: "45 seg", obs: "Manter respiração controlada." }
    ];

    // 3. Salvar no Banco como Rascunho para o Personal revisar
    const novoAluno = new Aluno({
      nome, 
      whatsapp, 
      objetivo: objetivo || 'Emagrecimento',
      statusTreino: 'Rascunho IA', // ⚠️ O Segredo: Fica laranja no painel do Personal!
      statusConta: 'Ativo',
      treinoPrescrito: treinoGeradoPelaIA, 
      checkins: []
    });

    await novoAluno.save();
    res.status(201).json({ mensagem: "Análise da IA concluída e aluno cadastrado!", aluno: novoAluno });

  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao processar IA.", erro: error.message });
  }
};