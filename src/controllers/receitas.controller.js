import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Sincronizado e Protegido) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        const whatsapp = String(whatsappRaw || "").trim().replace(/\D/g, "");

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        let user = await Usuario.findOne({ WhatsApp: whatsapp });
        
        if (!user) {
            user = new Usuario({ WhatsApp: whatsapp, nome: "Guerreiro(a)", pago: false, historico: [] });
        }

        // Sincroniza dados vindos do Front
        if (perfilExtraido) {
            if (perfilExtraido.nome) user.nome = perfilExtraido.nome;
            if (perfilExtraido.peso) user.peso = Number(String(perfilExtraido.peso).replace(',', '.'));
            if (perfilExtraido.altura) user.altura = Number(String(perfilExtraido.altura).replace(',', '.'));
            if (perfilExtraido.meta) user.meta = perfilExtraido.meta;
        }

        // Definição explícita de constantes para o prompt (EVITA ERRO DE DEFINIÇÃO)
        const constNome = user.nome || "Guerreiro(a)";
        const constPeso = user.peso || "Não informado";
        const constAltura = user.altura || "Não informada";
        const constMeta = user.meta || "Emagrecimento";

        const mensagensParaEnviar = [
            { 
                role: "system", 
                content: `Você é um nutricionista esportivo de elite. PERFIL DO ALUNO: Nome: ${constNome}, Peso: ${constPeso}kg, Altura: ${constAltura}m, Objetivo: ${constMeta}.` 
            },
            ...(user.historico || []).slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: mensagemAtual }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        if (!user.historico) user.historico = [];
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaIA });
        
        user.markModified('historico');
        await user.save();

        res.json({ 
            resposta: respostaIA,
            perfilAtualizado: { 
                nome: user.nome, 
                peso: user.peso, 
                altura: user.altura,
                meta: user.meta
            }
        });

    } catch (err) {
        console.error("❌ ERRO NO CHAT:", err.message); 
        res.status(200).json({ resposta: "Tive um soluço técnico aqui, mas já me recuperei! Pode repetir?" });
    }
};

// --- 2. MENTOR DE TREINO IA (Sincronizado) ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfilExtraido } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        const user = await Usuario.findOne({ WhatsApp: whatsappLimpo });

        const dadosTreino = {
            nome: perfilExtraido?.nome || user?.nome || "Guerreiro",
            peso: Number(perfilExtraido?.peso || user?.peso || 75),
            altura: Number(perfilExtraido?.altura || user?.altura || 1.75),
            meta: perfilExtraido?.meta || user?.meta || objetivo || "Performance"
        };

        const imcCalculado = (dadosTreino.peso / (dadosTreino.altura * dadosTreino.altura)).toFixed(1);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Você é um Personal Trainer de Elite. Atleta: ${dadosTreino.nome}, IMC: ${imcCalculado}, Meta: ${dadosTreino.meta}. Responda apenas em JSON.` 
                },
                { role: "user", content: "Gere meu plano de treino semanal." }
            ],
            response_format: { type: "json_object" }
        });

        const treinoData = JSON.parse(completion.choices[0].message.content);

        if (user) {
            user.treinoCustomizado = JSON.stringify(treinoData);
            await user.save();
        }

        res.json(treinoData);
    } catch (err) {
        console.error("❌ ERRO TREINO:", err.message);
        res.status(500).json({ erro: "Falha ao gerar treino." });
    }
};

// --- 3. DADOS DO USUÁRIO ---
export const obterDadosUsuario = async (req, res) => {
  try {
    const { whatsapp } = req.params;
    const usuario = await Usuario.findOne({ WhatsApp: String(whatsapp).replace(/\D/g, "") });

    if (!usuario) return res.status(404).json({ mensagem: "Usuário novo" });

    return res.status(200).json({
        nome: usuario.nome || "Guerreiro",
        peso: usuario.peso || 0,
        altura: usuario.altura || 0,
        meta: usuario.meta || "Emagrecimento",
        pago: usuario.pago || false
      });
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno" });
  }
};

// --- 4. HISTÓRICO ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: String(whatsapp).replace(/\D/g, "") });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar histórico" });
    }
};

// --- 5. ATIVAÇÃO VIP ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        await Usuario.findOneAndUpdate(
            { WhatsApp: String(whatsapp).replace(/\D/g, "") }, 
            { pago: true }
        );
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao ativar VIP" });
    }
};