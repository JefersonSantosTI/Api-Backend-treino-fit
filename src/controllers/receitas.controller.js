import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import gerarDadosTreino from "../services/geradorTreinoIA.js"; // Importe o serviço aqui
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Mantido como está) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        const whatsLimpo = String(whatsappRaw || "").replace(/\D/g, "").trim();

        if (!whatsLimpo || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados faltando" });
        }

        let user = await Usuario.findOne({ WhatsApp: whatsLimpo }) || await Usuario.findOne({ whatsapp: whatsLimpo });

        if (!user) {
            user = new Usuario({ WhatsApp: whatsLimpo, nome: "Guerreiro(a)", pago: false, historico: [] });
        }

        const NOME_FINAL = perfilExtraido?.nome || user.nome || "Guerreiro(a)";
        const PESO_FINAL = perfilExtraido?.peso || user.peso || "90";
        const ALTURA_FINAL = perfilExtraido?.altura || user.altura || "1.75";
        const META_FINAL = perfilExtraido?.meta || user.meta || "Emagrecimento";

        const historicoSeguro = (user.historico || []).slice(-6).map(h => ({
            role: h.role || h.papel || "user",
            content: h.content || h.contente || ""
        }));

        const mensagensParaEnviar = [
            { role: "system", content: `Você é um nutricionista. Aluno: ${NOME_FINAL}, Peso: ${PESO_FINAL}kg, Altura: ${ALTURA_FINAL}m, Meta: ${META_FINAL}.` },
            ...historicoSeguro,
            { role: "user", content: mensagemAtual }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar, {
            nome: NOME_FINAL, peso: PESO_FINAL, altura: ALTURA_FINAL, meta: META_FINAL
        });

        user.historico.push({ role: 'user', content: mensagemAtual }, { role: 'assistant', content: respostaIA });
        user.markModified('historico');
        await user.save();

        res.json({ resposta: respostaIA, perfilAtualizado: { nome: NOME_FINAL, peso: PESO_FINAL, altura: ALTURA_FINAL } });
    } catch (err) {
        console.error("❌ ERRO NO CHAT:", err.message);
        res.status(200).json({ resposta: "Tive um soluço técnico aqui, mas já me recuperei!" });
    }
};

// --- 2. MENTOR DE TREINO IA (CORRIGIDO) ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfilExtraido } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        const user = await Usuario.findOne({ WhatsApp: whatsappLimpo });

        const dadosParaIA = {
            nome: perfilExtraido?.nome || user?.nome || "Guerreiro",
            peso: Number(perfilExtraido?.peso || user?.peso || 75),
            altura: Number(perfilExtraido?.altura || user?.altura || 1.75),
            meta: perfilExtraido?.meta || user?.meta || objetivo || "Performance"
        };

        // CHAMA O SEU SERVIÇO TÉCNICO
        const treinoData = await gerarDadosTreino(dadosParaIA.meta, dadosParaIA);

        if (user) {
            // Salva como string para garantir compatibilidade com o Schema
            user.treinoCustomizado = JSON.stringify(treinoData);
            user.markModified('treinoCustomizado');
            await user.save();
        }

        res.json(treinoData);
    } catch (err) {
        console.error("❌ ERRO TREINO:", err.message);
        res.status(500).json({ erro: "Falha ao gerar treino técnico." });
    }
};

// --- 3. DADOS DO USUÁRIO (Mantido como está) ---
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

// --- 4. HISTÓRICO (Mantido como está) ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: String(whatsapp).replace(/\D/g, "") });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar histórico" });
    }
};

// --- 5. ATIVAÇÃO VIP (Mantido como está) ---
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