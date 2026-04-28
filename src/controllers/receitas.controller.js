import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import OpenAI from "openai";
import mongoose from "mongoose";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Blindado contra Erro 500) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        const whatsapp = String(whatsappRaw || "").trim().replace(/\D/g, "");

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        // BUSCA SEGURA: Garantindo que olhamos para a coleção certa
        let user = await Usuario.findOne({ WhatsApp: whatsapp });
        
        if (!user) {
            user = new Usuario({ WhatsApp: whatsapp, nome: "Guerreiro(a)", pago: false, historico: [] });
        }

        // Sincroniza os dados vindos do Front (perfilExtraido)
        if (perfilExtraido) {
            if (perfilExtraido.nome) user.nome = perfilExtraido.nome;
            if (perfilExtraido.peso) user.peso = Number(String(perfilExtraido.peso).replace(',', '.'));
            if (perfilExtraido.altura) user.altura = Number(String(perfilExtraido.altura).replace(',', '.'));
        }

        // Validação para não quebrar o prompt se o peso for zero
        const pesoInfo = user.peso || "Não informado";
        const alturaInfo = user.altura || "Não informada";

        const mensagensParaEnviar = [
            { role: "system", content: `Você é um nutricionista esportivo de alta performance. Usuário: ${user.nome}, Peso: ${pesoInfo}kg, Altura: ${alturaInfo}m.` },
            ...(user.historico || []).slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: mensagemAtual }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // SALVAMENTO SEGURO
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
                altura: user.altura 
            }
        });

    } catch (err) {
        console.error("❌ ERRO NO CHAT:", err.message);
        // Retorna 200 com mensagem de erro amigável para o app não travar
        res.status(200).json({ resposta: "Desculpe, tive um erro temporário. Pode repetir?" });
    }
};

// --- 2. MENTOR DE TREINO IA (Ajustado para perfilExtraido) ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfilExtraido } = req.body; // Mudado de 'perfil' para 'perfilExtraido'
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        const peso = parseFloat(perfilExtraido?.peso || 70);
        const altura = parseFloat(perfilExtraido?.altura || 1.70);
        const imc = (peso / (altura * altura)).toFixed(1);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Gere um treino de elite em JSON para objetivo ${objetivo}. IMC: ${imc}. Nome do atleta: ${perfilExtraido?.nome || 'Guerreiro'}.` 
                },
                { role: "user", content: "Gere o plano de treino completo em formato JSON agora." }
            ],
            response_format: { type: "json_object" }
        });

        const treinoData = JSON.parse(completion.choices[0].message.content);

        await Usuario.findOneAndUpdate(
            { WhatsApp: whatsappLimpo },
            { treinoCustomizado: JSON.stringify(treinoData) }
        );

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
    const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

    // Busca direta pelo Model para evitar conflito de conexão
    const usuario = await Usuario.findOne({ WhatsApp: whatsappLimpo });

    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário novo" });
    }

    return res.status(200).json({
        nome: usuario.nome || "Guerreiro",
        peso: usuario.peso || 0,
        altura: usuario.altura || 0,
        meta: usuario.meta || "Emagrecimento",
        pago: usuario.pago || false
      });

  } catch (err) {
    console.error("❌ ERRO AO OBTER DADOS:", err.message);
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