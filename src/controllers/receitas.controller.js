import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";

// 1. CHAT E PERGUNTA
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual: mensagemRaw, perfilExtraido } = req.body;
        const whatsapp = String(whatsappRaw || "").trim();
        const mensagemAtual = String(mensagemRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        // AJUSTADO: Busca usando 'WhatsApp' (Maiúsculo)
        let user = await Usuario.findOne({ WhatsApp: whatsapp });
        
        if (!user) {
            // AJUSTADO: Criação usando 'WhatsApp' (Maiúsculo)
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

        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaFormatada });
        
        // Garante que o Mongoose marque as alterações para salvar
        user.markModified('historico');
        user.markModified('dadosBiometricos');
        await user.save();

        res.json({ 
            resposta: respostaFormatada,
            isTrial: !isVip,
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
        // AJUSTADO: Busca usando 'WhatsApp'
        const user = await Usuario.findOne({ WhatsApp: whatsapp });
        if (!user) return res.status(404).json({ erro: "Não encontrado" });

        res.json({
            nome: user.nome,
            peso: user.dadosBiometricos?.peso,
            altura: user.dadosBiometricos?.altura,
            pago: user.pago,
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
        // AJUSTADO: Busca usando 'WhatsApp'
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
        // AJUSTADO: Busca usando 'WhatsApp'
        await Usuario.findOneAndUpdate({ WhatsApp: whatsapp }, { pago: true });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: "Erro VIP" });
    }
};