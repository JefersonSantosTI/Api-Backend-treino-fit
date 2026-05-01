import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import gerarDadosTreino from "../services/geradorTreinoIA.js"; 
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (ATUALIZADO COM IDADE) ---
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

        // --- ADIÇÃO DO FATOR IDADE ---
        const NOME_FINAL = perfilExtraido?.nome || user.nome || "Guerreiro(a)";
        const PESO_FINAL = perfilExtraido?.peso || user.peso || "90";
        const ALTURA_FINAL = perfilExtraido?.altura || user.altura || "1.75";
        const META_FINAL = perfilExtraido?.meta || user.meta || "Emagrecimento";
        const IDADE_FINAL = perfilExtraido?.idade || user.idade || "25"; // Puxa a idade do perfil ou do banco

        const historicoSeguro = (user.historico || []).slice(-6).map(h => ({
            role: h.role || h.papel || "user",
            content: h.content || h.contente || ""
        }));

        // Injetando a IDADE para o service não retornar erro de cálculo (NaN)
        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar, {
            nome: NOME_FINAL, 
            peso: PESO_FINAL, 
            altura: ALTURA_FINAL, 
            meta: META_FINAL,
            idade: IDADE_FINAL 
        });

        user.historico.push({ role: 'user', content: mensagemAtual }, { role: 'assistant', content: respostaIA });
        user.markModified('historico');
        await user.save();

        res.json({ 
            resposta: respostaIA, 
            perfilAtualizado: { 
                nome: NOME_FINAL, 
                peso: PESO_FINAL, 
                altura: ALTURA_FINAL,
                idade: IDADE_FINAL 
            } 
        });
    } catch (err) {
        console.error("❌ ERRO NO CHAT:", err.message);
        res.status(200).json({ resposta: "Tive um soluço técnico aqui, mas já me recuperei!" });
    }
};

// --- 2. MENTOR DE TREINO IA (MANTIDO) ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfilExtraido } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        const user = await Usuario.findOne({ WhatsApp: whatsappLimpo });

        const dadosParaIA = {
            nome: perfilExtraido?.nome || user?.nome || "Guerreiro",
            peso: Number(perfilExtraido?.peso || user?.peso || 75),
            altura: Number(perfilExtraido?.altura || user?.altura || 1.75),
            idade: Number(perfilExtraido?.idade || user?.idade || 25), // Adicionado para consistência
            meta: perfilExtraido?.meta || user?.meta || objetivo || "Performance"
        };

        const treinoData = await gerarDadosTreino(dadosParaIA.meta, dadosParaIA);

        if (user) {
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

// --- 3. DADOS DO USUÁRIO (ATUALIZADO COM IDADE) ---
export const obterDadosUsuario = async (req, res) => {
  try {
    const { whatsapp } = req.params;
    const usuario = await Usuario.findOne({ WhatsApp: String(whatsapp).replace(/\D/g, "") });
    
    if (!usuario) return res.status(404).json({ mensagem: "Usuário novo" });
    
    return res.status(200).json({
        nome: usuario.nome || "Guerreiro",
        peso: usuario.peso || 0,
        altura: usuario.altura || 0,
        idade: usuario.idade || 25, // Retorna a idade para o Front-end
        meta: usuario.meta || "Emagrecimento",
        pago: usuario.pago || false
      });
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno" });
  }
};

// --- 4. HISTÓRICO (MANTIDO) ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: String(whatsapp).replace(/\D/g, "") });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar histórico" });
    }
};

// --- 5. ATIVAÇÃO VIP (MANTIDO) ---
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