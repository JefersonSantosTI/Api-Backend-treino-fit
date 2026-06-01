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

// =========================================================
// LOGIN DO ALUNO NO PORTAL (Filtro Blindado Anti-Acento e Espaço)
// =========================================================
export const loginAluno = async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome) return res.status(400).json({ mensagem: 'Parâmetro obrigatório.' });

    // 1. Puxa todos os alunos do banco de dados (Rápido e seguro para assessorias)
    const todosAlunos = await Aluno.find();

    // 2. Limpa o que o aluno digitou:
    // .trim() tira espaços nas pontas
    // .toLowerCase() deixa tudo minúsculo
    // .normalize e .replace tiram TODOS os acentos (Márcio Araújo vira marcio araujo)
    const nomeBuscadoLimpo = nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Procura na lista varrendo o banco de dados e limpando os nomes de lá também
    const alunoEncontrado = todosAlunos.find(aluno => {
      // Se no banco estiver " Márcio Araújo ", ele limpa e transforma em "marcio araujo" para comparar
      const nomeBancoLimpo = aluno.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nomeBancoLimpo === nomeBuscadoLimpo;
    });

    if (!alunoEncontrado) {
      return res.status(404).json({ mensagem: 'Aluno não encontrado na assessoria.' });
    }

    res.status(200).json(alunoEncontrado);
  } catch (error) { 
    console.error("Erro no login:", error);
    res.status(500).json({ erro: error.message }); 
  }
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
    // ✅ 1. ADICIONADO O FEEDBACK AQUI PARA RECEBER DO FRONT-END
    const { data, diaSemana, feedback } = req.body; 
    
    const aluno = await Aluno.findById(id);
    if (!aluno) return res.status(404).json({ window: 'Não encontrado.' });
    const jaFezCheckin = aluno.checkins.some(c => c.data === data);
    if (jaFezCheckin) return res.status(400).json({ mensagem: 'Check-in já realizado.' });

    // ✅ 2. ENVIANDO O FEEDBACK PARA SER SALVO NO BANCO
    aluno.checkins.unshift({ data, diaSemana, feedback }); 
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

// =========================================================
// ✅ NOVA FUNÇÃO: ATUALIZA BIOMETRIA E RECALCULA IA (EDICAO PELO PERSONAL)
// =========================================================
export const atualizarBiometria = async (req, res) => {
  try {
    const { id } = req.params;
    const novosDados = req.body;

    const aluno = await Aluno.findById(id);
    
    if (!aluno) {
      return res.status(404).json({ mensagem: "Aluno não encontrado no banco de dados." });
    }

    // Atualiza apenas os dados enviados, mantendo os que não foram alterados
    aluno.peso = novosDados.peso || aluno.peso;
    aluno.altura = novosDados.altura || aluno.altura;
    aluno.idade = novosDados.idade || aluno.idade;
    aluno.objetivo = novosDados.meta || aluno.objetivo; 
    aluno.nivel = novosDados.nivel || aluno.nivel;
    aluno.diasTreino = novosDados.diasTreino || aluno.diasTreino;
    aluno.restricoes = novosDados.restricoes || aluno.restricoes;
    aluno.lesoes = novosDados.lesoes || aluno.lesoes;
    aluno.genero = novosDados.genero || aluno.genero;

    await aluno.save();

    // Mock das mensagens obrigatórias para não quebrar a chamada do openai.service
    const promptFake = [{ role: "user", content: `Recalcule o plano completo para o aluno ${aluno.nome}.` }];

    // Monta o payload para injetar no openai.service.js
    const payloadIA = {
      nome: aluno.nome,
      peso: aluno.peso,
      altura: aluno.altura,
      idade: aluno.idade,
      meta: aluno.objetivo,
      genero: aluno.genero || "Masculino",
      nivel: aluno.nivel,
      diasTreino: aluno.diasTreino,
      restricoes: aluno.restricoes,
      lesoes: aluno.lesoes
    };

    // Acorda a IA para gerar o novo treino, dieta e água
    const novaPrescricaoIA = await obterRespostaReceitas(promptFake, payloadIA, "personal_ia");

    // Injeta a nova prescrição de volta no banco do aluno
    aluno.treinoSemanal = novaPrescricaoIA.treinoSemanal || aluno.treinoSemanal;
    aluno.dietaPrescrita = novaPrescricaoIA.dieta || aluno.dietaPrescrita;
    aluno.metaAgua = novaPrescricaoIA.agua || aluno.metaAgua;
    aluno.statusTreino = "Rascunho IA"; // Retorna para revisão, para o Personal conferir

    await aluno.save();

    res.status(200).json(aluno);
  } catch (error) {
    console.error("Erro Crítico ao atualizar biometria e recalcular IA:", error);
    res.status(500).json({ erro: error.message });
  }
};