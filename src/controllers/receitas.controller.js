import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";

// 1. CHAT E PERGUNTA
export const perguntaReceita = async (req, res) => {
    try {
        // Ajuste para aceitar tanto 'mensagemAtual' (do chat) quanto 'objetivo' (do botão de treino)
        const { whatsapp: whatsappRaw, mensagemAtual, objetivo, perfilExtraido } = req.body;
        
        const whatsapp = String(whatsappRaw || "").trim();
        // Se vier do botão de treino, usamos o 'objetivo' como a mensagem para a IA
        const mensagemFinal = mensagemAtual || objetivo; 

        if (!whatsapp || !mensagemFinal) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        // ... resto do seu código igual (busca usuário, salva biometria, chama OpenAI)
        // Busca ou cria o usuário
        let user = await Usuario.findOne({ WhatsApp: whatsapp });
        
        if (!user) {
            user = await Usuario.create({ WhatsApp: whatsapp, nome: "Guerreiro(a)", pago: false });
        }

        // SALVAMENTO NOS DADOS BIOMÉTRICOS
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

        const isVip = user.pago === true || user.pago === "true";
        
        const mensagensParaEnviar = [
            { role: "system", content: "Você é um nutricionista esportivo de alta performance." },
            ...user.historico.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: mensagemAtual }
        ];

        let respostaIA = await obterRespostaReceitas(mensagensParaEnviar);
        const respostaFormatada = String(respostaIA).trim();

        // --- LÓGICA DE DETECÇÃO DE TREINO ---
        const temTreino = respostaFormatada.toLowerCase().includes("séries") || 
                          respostaFormatada.toLowerCase().includes("repetições") ||
                          respostaFormatada.includes("[TREINO_DATA]");

        if (temTreino) {
            user.treinoCustomizado = respostaFormatada;
            user.markModified('treinoCustomizado');
        }

        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaFormatada });
        
        user.markModified('historico');
        user.markModified('dadosBiometricos');
        await user.save();

        res.json({ 
            resposta: respostaFormatada,
            isTrial: !isVip,
            treinoIdentificado: temTreino ? respostaFormatada : null, 
            perfilAtualizado: { 
                nome: user.nome, 
                peso: user.dadosBiometricos?.peso || "", 
                altura: user.dadosBiometricos?.altura || "" 
            }
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err);
        res.status(500).json({ erro: "Erro interno: " + err.message });
    }
};

// 2. BUSCAR DADOS DO USUÁRIO
export const obterDadosUsuario = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: whatsapp });
        if (!user) return res.status(404).json({ erro: "Não encontrado" });

        res.json({
            nome: user.nome,
            peso: user.dadosBiometricos?.peso,
            altura: user.dadosBiometricos?.altura,
            pago: user.pago,
            treinoIA: user.treinoCustomizado || null, 
            historico: user.historico
        });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao obter dados" });
    }
};

// 3. BUSCAR HISTÓRICO
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: whatsapp });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro histórico" });
    }
};

// 4. TORNAR VIP
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        await Usuario.findOneAndUpdate({ WhatsApp: whatsapp }, { pago: true });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: "Erro VIP" });
    }
};