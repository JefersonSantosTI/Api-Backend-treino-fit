import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Sincronizado e Protegido) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        // Limpa o número para garantir que bata com o banco "61991268229"
        const whatsLimpo = String(whatsappRaw || "").trim().replace(/\D/g, "");

        if (!whatsLimpo || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        // BUSCA EXATA: Note o "WhatsApp" com W maiúsculo como está no seu print do MongoDB
        let user = await Usuario.findOne({ WhatsApp: whatsLimpo });
        
        if (!user) {
            user = new Usuario({ 
                WhatsApp: whatsLimpo, 
                nome: "Guerreiro(a)", 
                pago: false, 
                historico: [] 
            });
        }

        // Sincroniza dados com o perfil que vem do Front
        if (perfilExtraido) {
            if (perfilExtraido.nome) user.nome = perfilExtraido.nome;
            if (perfilExtraido.peso) user.peso = Number(String(perfilExtraido.peso).replace(',', '.'));
            if (perfilExtraido.altura) user.altura = Number(String(perfilExtraido.altura).replace(',', '.'));
            if (perfilExtraido.meta) user.meta = perfilExtraido.meta;
        }

        // SEGURANÇA: Criamos constantes fixas para o Prompt
        const NOME_IA = user.nome || "Guerreiro(a)";
        const PESO_IA = user.peso || "90";
        const ALTURA_IA = user.altura || "1.70";
        const META_IA = user.meta || "Emagrecimento";

        // Ajuste do Histórico: Garantir que role e content existam
        const historicoLimpo = (user.historico || []).slice(-6).map(h => ({
            role: h.role || h.papel || "user", // h.papel é caso o banco tenha salvo traduzido
            content: h.content || h.contente || "" 
        }));

        const mensagensParaEnviar = [
            { 
                role: "system", 
                content: `Você é um nutricionista esportivo. Aluno: ${NOME_IA}, Peso: ${PESO_IA}kg, Altura: ${ALTURA_IA}m, Meta: ${META_IA}.` 
            },
            ...historicoLimpo,
            { role: "user", content: mensagemAtual }
        ];

        // Chama o serviço da OpenAI
        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salva no histórico (Usando os nomes padrões do Mongoose/OpenAI)
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
        // Se der erro, o console vai dizer exatamente onde foi
        console.error("❌ ERRO NO CHAT:", err.message); 
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