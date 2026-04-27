import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import OpenAI from "openai";
import mongoose from "mongoose";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Ajustado para o novo Schema) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        const whatsapp = String(whatsappRaw || "").trim().replace(/\D/g, "");

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        // Busca o usuário
        let user = await Usuario.findOne({ WhatsApp: whatsapp });
        
        if (!user) {
            user = await Usuario.create({ WhatsApp: whatsapp, nome: "Guerreiro(a)", pago: false });
        }

        // --- CORREÇÃO AQUI: Atualiza os dados soltos (sem dadosBiometricos) ---
        if (perfilExtraido) {
            if (perfilExtraido.nome) user.nome = perfilExtraido.nome;
            if (perfilExtraido.peso) {
                user.peso = Number(String(perfilExtraido.peso).replace(',', '.'));
            }
            if (perfilExtraido.altura) {
                user.altura = Number(String(perfilExtraido.altura).replace(',', '.'));
            }
        }

        // Prepara histórico
        const mensagensParaEnviar = [
            { role: "system", content: `Você é um nutricionista esportivo. Usuário: ${user.nome}, Peso: ${user.peso}kg, Altura: ${user.altura}m.` },
            ...user.historico.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: mensagemAtual }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salva histórico
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaIA });
        
        user.markModified('historico');
        await user.save();

        res.json({ 
            resposta: respostaIA,
            perfilAtualizado: { 
                nome: user.nome, 
                peso: user.peso || "", 
                altura: user.altura || "" 
            }
        });

    } catch (err) {
        console.error("❌ ERRO NO CHAT:", err.message);
        res.status(500).json({ erro: "Erro ao processar consulta." });
    }
};

// --- 2. MENTOR DE TREINO IA ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfil } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        // Usa os dados do perfil enviado ou do banco
        const peso = parseFloat(perfil?.peso || 70);
        const altura = parseFloat(perfil?.altura || 1.70);
        const imc = (peso / (altura * altura)).toFixed(1);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Gere um treino de elite em JSON para objetivo ${objetivo}. IMC: ${imc}.` 
                },
                { role: "user", content: "Gere o plano agora em formato JSON." }
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

// --- 3. DADOS DO USUÁRIO (Sincronização do Home) ---
export const obterDadosUsuario = async (req, res) => {
  try {
    const { whatsapp } = req.params;
    const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

    const db = mongoose.connection.useDb('nutricionista_db');
    const colecao = db.collection('usuários');

    const usuario = await colecao.findOne({ WhatsApp: whatsappLimpo });

    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário novo" });
    }

    // Retorna os dados exatos que o App.js espera
    return res.status(200).json({
        nome: usuario.nome || "Guerreiro",
        peso: usuario.peso || 0, // Agora ele vai achar o 98.8 aqui
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