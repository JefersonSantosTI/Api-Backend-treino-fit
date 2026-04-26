import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Lógica de Texto e Biometria) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        const whatsapp = String(whatsappRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        // Busca ou cria o usuário
        let user = await Usuario.findOne({ WhatsApp: whatsapp });
        if (!user) {
            user = await Usuario.create({ WhatsApp: whatsapp, nome: "Guerreiro(a)", pago: false });
        }

        // Atualiza biometria se a IA detectou peso/altura no texto do chat
        if (perfilExtraido) {
            if (!user.dadosBiometricos) user.dadosBiometricos = {};
            if (perfilExtraido.nome) user.nome = perfilExtraido.nome;
            if (perfilExtraido.peso) {
                user.dadosBiometricos.peso = Number(String(perfilExtraido.peso).replace(',', '.'));
            }
            if (perfilExtraido.altura) {
                user.dadosBiometricos.altura = Number(String(perfilExtraido.altura).replace(',', '.'));
            }
        }

        // Prepara histórico para manter o contexto do chat
        const mensagensParaEnviar = [
            { role: "system", content: "Você é um nutricionista esportivo de alta performance. Sua missão é montar dietas e tirar dúvidas nutricionais." },
            ...user.historico.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: mensagemAtual }
        ];

        // Chama o serviço de IA para Nutrição (Retorna Texto)
        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salva interação no histórico
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaIA });
        
        user.markModified('historico');
        user.markModified('dadosBiometricos');
        await user.save();

        res.json({ 
            resposta: respostaIA,
            perfilAtualizado: { 
                nome: user.nome, 
                peso: user.dadosBiometricos?.peso || "", 
                altura: user.dadosBiometricos?.altura || "" 
            }
        });

    } catch (err) {
        console.error("ERRO CHAT NUTRI:", err);
        res.status(500).json({ erro: "Erro ao processar consulta nutricional." });
    }
};

// --- 2. MENTOR DE TREINO IA (Lógica de JSON Puro para Cards) ---
// --- 2. MENTOR DE TREINO IA (Alta Performance com Técnicas Avançadas) ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfil } = req.body;

        if (!whatsapp || !objetivo) {
            return res.status(400).json({ erro: "WhatsApp e Objetivo são necessários." });
        }

        // Cálculos de segurança para a IA
        const peso = parseFloat(perfil?.peso || 70);
        const altura = parseFloat(perfil?.altura || 1.70);
        const imc = (peso / (altura * altura)).toFixed(1);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Você é o Head Coach Treino Fit. Sua missão é gerar treinos de elite em JSON.
                    
                    DIRETRIZES TÉCNICAS:
                    - Objetivo HIPERTROFIA: Foco em Tensão Mecânica. Use: Pirâmide, Rest-Pause, Pico de Contração.
                    - Objetivo EMAGRECIMENTO: Foco em Gasto Calórico. Use: Drop-sets, Bi-sets, Repetições Altas.
                    - IMC DO ALUNO: ${imc}. (Se > 30, evite exercícios de alto impacto).
                    
                    REGRA DE NOMENCLATURA: Use nomes padrões e curtos (ex: Supino Reto, Leg Press 45, Rosca Direta) para compatibilidade com sistema de GIFs.
                    
                    FORMATO OBRIGATÓRIO (JSON PURO):
                    {
                      "fase": "Nome da Fase (ex: Choque Metabólico)",
                      "frase_coach": "Frase motivacional técnica",
                      "treino": [
                        {"nome": "Nome do Exercício", "series": "4", "reps": "8-12", "tecnica": "Rest-pause", "obs": "3s na descida"},
                        {"nome": "Próximo", "series": "3", "reps": "15", "tecnica": "Drop-set", "obs": "Até a falha"}
                      ],
                      "cardio": "Protocolo detalhado (ex: 15min HIIT na esteira)"
                    }` 
                },
                { 
                    role: "user", 
                    content: `Gere um plano de ${objetivo} para um aluno com IMC ${imc}.` 
                }
            ],
            response_format: { type: "json_object" }
        });

        const treinoData = JSON.parse(completion.choices[0].message.content);

        // Salvando no banco de dados
        await Usuario.findOneAndUpdate(
            { WhatsApp: whatsapp },
            { treinoCustomizado: JSON.stringify(treinoData) } // Salvamos o objeto completo (fase, frase, treino, cardio)
        );

        res.json(treinoData);
    } catch (err) {
        console.error("ERRO GERADOR TREINO:", err);
        res.status(500).json({ erro: "Falha ao gerar treino de elite." });
    }
};
// --- 3. DADOS DO USUÁRIO ---
import mongoose from "mongoose";

export const obterDadosUsuario = async (req, res) => {
  try {
    const { whatsapp } = req.params;
    if (!whatsapp) return res.status(400).json({ erro: "WhatsApp ausente" });

    const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

    // Conecta ao banco correto e coleção com acento
    const db = mongoose.connection.useDb('nutricionista_db');
    const colecao = db.collection('usuários');

    // BUSCA COM REGEX: Isso encontra o número mesmo se tiver espaços no banco
    const usuario = await colecao.findOne({ 
      WhatsApp: { $regex: whatsappLimpo } 
    });

    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário novo" });
    }

    // RESPOSTA SEGURA: Evita o erro 500 se algum campo estiver estranho
    return res.status(200).json({
      nome: usuario.nome || "Guerreiro",
      peso: usuario.peso || 0,
      altura: usuario.altura || 0,
      meta: usuario.meta || "Emagrecimento",
      pago: usuario.pago || false,
      // Se treinoPersonalizado já for objeto, não usamos JSON.parse
      treinoIA: typeof usuario.treinoPersonalizado === 'string' 
                ? JSON.parse(usuario.treinoPersonalizado) 
                : usuario.treinoPersonalizado
    });

  } catch (err) {
    // Esse log vai aparecer no painel do Render para você!
    console.error("❌ ERRO NO GET USUARIO:", err.message);
    return res.status(500).json({ erro: "Erro interno no servidor" });
  }
};

// --- 4. HISTÓRICO DE CHAT ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: whatsapp });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar histórico" });
    }
};

// --- 5. ATIVAÇÃO VIP ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        await Usuario.findOneAndUpdate({ WhatsApp: whatsapp }, { pago: true });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao ativar acesso VIP" });
    }
};