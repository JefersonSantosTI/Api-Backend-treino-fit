import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Sincronizado e Protegido) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        
        // 1. Limpeza rigorosa do número
        const whatsLimpo = String(whatsappRaw || "").replace(/\D/g, "").trim();

        if (!whatsLimpo || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados faltando" });
        }

        // 2. Busca o usuário (Tenta WhatsApp com W maiúsculo primeiro, como no seu print)
        let user = await Usuario.findOne({ WhatsApp: whatsLimpo });
        
        // Se não achou com W maiúsculo, tenta minúsculo
        if (!user) {
            user = await Usuario.findOne({ whatsapp: whatsLimpo });
        }

        if (!user) {
            user = new Usuario({ 
                WhatsApp: whatsLimpo, 
                nome: "Guerreiro(a)", 
                pago: false, 
                historico: [] 
            });
        }

        // 3. Atualiza dados do perfil (Blindagem contra campos vazios)
        const NOME_FINAL = perfilExtraido?.nome || user.nome || "Guerreiro(a)";
        const PESO_FINAL = perfilExtraido?.peso || user.peso || "90";
        const ALTURA_FINAL = perfilExtraido?.altura || user.altura || "1.75";
        const META_FINAL = perfilExtraido?.meta || user.meta || "Emagrecimento";

        // 4. Limpeza do Histórico (Lida com 'role'/'papel' e 'content'/'contente')
        const historicoSeguro = (user.historico || user.histórico || []).slice(-6).map(h => ({
            role: h.role || h.papel || "user",
            content: h.content || h.contente || ""
        }));

        const mensagensParaEnviar = [
            { 
                role: "system", 
                content: `Você é um nutricionista. Aluno: ${NOME_FINAL}, Peso: ${PESO_FINAL}kg, Altura: ${ALTURA_FINAL}m, Meta: ${META_FINAL}.` 
            },
            ...historicoSeguro,
            { role: "user", content: mensagemAtual }
        ];

        // 5. Chamada para a IA
        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // 6. Salva no histórico (Garante que os campos existam)
        if (!user.historico) user.historico = [];
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaIA });
        
        user.markModified('historico');
        await user.save();

        res.json({ 
            resposta: respostaIA,
            perfilAtualizado: { nome: NOME_FINAL, peso: PESO_FINAL, altura: ALTURA_FINAL }
        });

    } catch (err) {
        // ESSA LINHA É A MAIS IMPORTANTE AGORA
        console.error("❌ ERRO REAL NO RENDER:", err.message); 
        res.status(200).json({ 
            resposta: "Tive um soluço técnico aqui, mas já me recuperei! Pode repetir sua pergunta?" 
        });
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