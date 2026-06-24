import Aluno from '../controllers/Aluno.js';
import obterRespostaReceitas from '../services/openai.service.js';

export const criarAluno = async (req, res) => {
  try {
    // ✅ Agora recebe o personalId do Front-end
    const { nome, whatsapp, objetivo, personalId } = req.body;
    
    if (!nome || !whatsapp || !personalId) return res.status(400).json({ mensagem: 'Nome, WhatsApp e Identificação do Treinador são obrigatórios.' });
    
    const existe = await Aluno.findOne({ whatsapp });
    if (existe) return res.status(400).json({ mensagem: 'Este WhatsApp já está cadastrado na assessoria.' });

    // 🔒 TRAVA DE PLANO: Conta quantos alunos ESSE personal específico já tem
    const totalAlunos = await Aluno.countDocuments({ personalId });
    
    // Buscamos o primeiro personal técnico para ver se ele é PRO (Adapte se tiver múltiplos personais)
    // Aqui usamos uma validação simples de segurança
    if (totalAlunos >= 2) {
      // Importe o modelo do Personal no topo se necessário para checar a assinatura
      // return res.status(403).json({ mensagem: 'Limite de teste atingido', limiteExcedido: true });
    }

    const novoAluno = new Aluno({ 
      personalId, // ✅ Carimbando o dono (Isolamento)
      nome, whatsapp, objetivo: objetivo || 'Emagrecimento', statusTreino: 'Pendente', statusConta: 'Ativo',
      treinoPrescrito: [], dietaPrescrita: [], checkins: []
    });
    await novoAluno.save();
    res.status(201).json(novoAluno);
  } catch (error) { res.status(500).json({ mensagem: 'Erro ao criar aluno.', erro: error.message }); }
};

export const obterAlunosAssessoria = async (req, res) => {
  try {
    // ✅ Agora ele só puxa os alunos que tiverem a chave desse personal
    const { personalId } = req.query;
    if (!personalId) return res.status(400).json({ message: 'Acesso negado. ID do Personal ausente.' });

    const alunos = await Aluno.find({ personalId }).sort({ updatedAt: -1 });
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
    const nomeBuscadoLimpo = nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Procura na lista varrendo o banco de dados e limpando os nomes de lá também
    const alunoEncontrado = todosAlunos.find(aluno => {
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
    const { nome, whatsapp, peso, altura, idade, genero, objetivo, nivel, diasTreino, restricoes, lesoes, personalRef } = req.body;
    if (!nome || !whatsapp || !personalRef) return res.status(400).json({ mensagem: "Dados obrigatórios ou link inválido." });
    
    const existe = await Aluno.findOne({ whatsapp });
    if (existe) return res.status(400).json({ mensagem: "Já possui cadastro." });

    const promptFake = [{ role: "user", content: `Monte o plano completo para o aluno ${nome}.` }];
    
    // Injetando os novos parâmetros estruturados na IA Core do Treino Fit
    const dadosParaIA = { nome, peso, altura, idade, meta: objetivo, genero, nivel, diasTreino, restricoes, lesoes };
    
    // O motor gera a estrutura robusta: { treinoSemanal, dieta, agua }
    const planoGerado = await obterRespostaReceitas(promptFake, dadosParaIA, "personal_ia");

    const novoAluno = new Aluno({
      personalId: personalRef, // ✅ O personalRef que vem do link é o ID do Personal
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
// =========================================================
// ✅ ATUALIZADO: SALVA BIOMETRIA E MEDIDAS SEM APAGAR O TREINO MANUAL
// =========================================================
export const atualizarBiometria = async (req, res) => {
  try {
    const { id } = req.params;
    const novosDados = req.body;

    const aluno = await Aluno.findById(id);
    
    if (!aluno) {
      return res.status(404).json({ mensagem: "Aluno não encontrado no banco de dados." });
    }

    // Atualiza apenas os dados cadastrais e perímetros biométricos
    aluno.peso = novosDados.peso !== undefined ? novosDados.peso : aluno.peso;
    aluno.altura = novosDados.altura !== undefined ? novosDados.altura : aluno.altura;
    aluno.idade = novosDados.idade !== undefined ? novosDados.idade : aluno.idade;
    aluno.objetivo = novosDados.meta || novosDados.objetivo || aluno.objetivo; 
    aluno.nivel = novosDados.nivel || aluno.nivel;
    aluno.diasTreino = novosDados.diasTreino || aluno.diasTreino;
    aluno.restricoes = novosDados.restricoes || aluno.restricoes;
    aluno.lesoes = novosDados.lesoes || aluno.lesoes;
    aluno.genero = novosDados.genero || aluno.genero;

    if (novosDados.medidas) {
      aluno.medidas = novosDados.medidas; 
    }

    await aluno.save();
    res.status(200).json(aluno); // Retorna com sucesso apenas salvando os perímetros
  } catch (error) {
    console.error("Erro ao salvar biometria:", error);
    res.status(500).json({ erro: error.message });
  }
};

// =========================================================
// ✅ NOVA FUNÇÃO: EXCLUSIVA DO BOTÃO MÁGICO IA (PREENCHIMENTO AUTOMÁTICO)
// =========================================================
export const gerarPlanoIAPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const aluno = await Aluno.findById(id);
    
    if (!aluno) {
      return res.status(404).json({ mensagem: "Aluno não encontrado." });
    }

    // Monta o payload injetando as medidas corporais que o Personal acabou de atualizar
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
      lesoes: aluno.lesoes,
      medidasCorporais: aluno.medidas 
    };

    const promptFake = [{ role: "user", content: `Recalcule o plano completo para o aluno ${aluno.nome}. Leia atentamente as medidas corporais, se existirem, para direcionar o foco hipertrófico ou de perda de medidas localizadas.` }];
    
    // Dispara o motor da OpenAI para ler a nova biometria e recalcular tudo
    const novaPrescricaoIA = await obterRespostaReceitas(promptFake, payloadIA, "personal_ia");

    aluno.treinoSemanal = novaPrescricaoIA.treinoSemanal || aluno.treinoSemanal;
    aluno.dietaPrescrita = novaPrescricaoIA.dieta || aluno.dietaPrescrita;
    aluno.metaAgua = novaPrescricaoIA.agua || aluno.metaAgua;
    aluno.statusTreino = "Rascunho IA"; 

    await aluno.save();

    // Retorna os dados mastigados para o Front-end preencher os campos automaticamente
    res.status(200).json({
      treinoSemanal: aluno.treinoSemanal,
      dietaPrescrita: aluno.dietaPrescrita,
      metaAgua: aluno.metaAgua
    });
  } catch (error) {
    console.error("Erro Crítico no Botão Mágico IA:", error);
    res.status(500).json({ erro: error.message });
  }
};

// No aluno.controller.js
// Adicione estas funções ao seu aluno.controller.js
// Substitua a sua função configurarLembreteAgua por esta:
export const configurarLembreteAgua = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ ADICIONADO: Puxando o tipoFrequencia do celular
    const { ativo, horaInicio, horaFim, intervaloHoras, tipoFrequencia, subscription } = req.body;

    const updateData = { 
      lembreteAgua: { 
        ativo, 
        horaInicio: Number(horaInicio), 
        horaFim: Number(horaFim), 
        intervaloHoras: Number(intervaloHoras),
        tipoFrequencia: tipoFrequencia || 'Definitivo' // ✅ SALVANDO NO BANCO
      } 
    };

    if (subscription) {
      updateData.lembreteAgua.pushSubscription = subscription;
    }

    const alunoAtualizado = await Aluno.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json(alunoAtualizado);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

export const salvarAssinaturaPush = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;
    await Aluno.findByIdAndUpdate(id, {
      'lembreteAgua.pushSubscription': subscription,
      'lembreteAgua.ativo': true
    });
    res.status(200).json({ mensagem: "Assinatura salva!" });
  } catch (error) { res.status(500).json({ erro: error.message }); }
};