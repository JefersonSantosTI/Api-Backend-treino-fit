import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO 1: OBTER HISTÓRICO ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp: String(whatsapp).trim() });

        if (!user) return res.json([]);

        const isVip = user.pago === true || user.pago === "true";

        const historicoLimpo = (user.historico || []).map(msg => {
            let texto = msg.content || "";
            if (isVip) {
                texto = texto.replace(/\[CONTEÚDO BLOQUEADO\]/g, "✅ (Liberado)");
                texto = texto.replace(/Para visualizar o restante do seu plano.*/gi, "Aproveite seu acesso VIP! 💪");
                texto = texto.replace(/clique no BOTÃO LARANJA.*/gi, "Plano completo liberado.");
            }
            return { role: msg.role === 'assistant' ? 'assistant' : 'user', content: texto };
        });

        res.json(historicoLimpo);
    } catch (err) {
        console.error("ERRO AO BUSCAR HISTÓRICO:", err.message);
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
};

// --- FUNÇÃO 2: PERGUNTA COM SALVAMENTO AUTOMÁTICO DE PERFIL ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual: mensagemRaw, nomeNoPerfil } = req.body;
        const whatsapp = String(whatsappRaw || "").trim();
        const mensagemAtual = String(mensagemRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "WhatsApp e mensagem são obrigatórios" });
        }

        let user = await Usuario.findOne({ whatsapp });
        
        if (!user) {
            user = await Usuario.create({ 
                whatsapp, 
                historico: [], 
                pago: false,
                nome: nomeNoPerfil || "Guerreiro(a)",
                peso: "0",
                altura: "0",
                meta: "Definir"
            });
        }

        const isVip = user.pago === true || user.pago === "true";
        const nomeUser = user.nome || "Guerreiro(a)";
        const pesoUser = user.peso && user.peso !== "0" ? `${user.peso}kg` : "não informado";
        const alturaUser = user.altura && user.altura !== "0" ? `${user.altura}m` : "não informada";

        let instrucaoSeguranca = `Você é a Ana, nutricionista do TreinoFit. Você conversa com ${nomeUser}.
        Dados atuais: Peso ${pesoUser}, Altura ${alturaUser}.`;

        if (!isVip) {
            instrucaoSeguranca += `
                ### PROTOCOLO DE CONVERSÃO TRIAL ###
                1. O usuário ainda não é VIP. Mostre autoridade e trave o conteúdo na metade.
                2. Use OBRIGATORIAMENTE: [CONTEÚDO BLOQUEADO] seguido do convite para o VIP.
            `;
        } else {
            instrucaoSeguranca += `
                ### MODO VIP LIBERADO ###
                1. Forneça planos COMPLETOS. Nunca mencione bloqueios ou botões.
            `;
        }

        let historicoParaIA = (user.historico || [])
            .slice(-6) 
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

        const mensagensParaEnviar = [
            { role: 'system', content: instrucaoSeguranca },
            ...historicoParaIA,
            { role: 'user', content: mensagemAtual }
        ];

        let respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        if (isVip) {
            respostaIA = String(respostaIA)
                .replace(/\[CONTEÚDO BLOQUEADO\]/gi, "")
                .replace(/Para visualizar o restante do seu plano.*/gi, "")
                .replace(/clique no BOTÃO LARANJA.*/gi, "")
                .trim();
        }

        // --- LÓGICA DE EXTRAÇÃO DE DADOS (Para atualizar a Home) ---
        // Se a Ana identificar dados na conversa, salvamos no banco
        const regexPeso = mensagemAtual.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
        const regexAltura = mensagemAtual.match(/(\d(?:[.,]\d+)?)\s*m/i);
        const regexNome = mensagemAtual.match(/meu nome é (.*?)($|[.,!])/i);

        if (regexPeso) user.peso = regexPeso[1].replace(',', '.');
        if (regexAltura) user.altura = regexAltura[1].replace(',', '.');
        if (regexNome) user.nome = regexNome[1].trim();

        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        
        await user.save();

        res.json({ 
            resposta: respostaIA,
            isTrial: !isVip,
            perfilAtualizado: { nome: user.nome, peso: user.peso, altura: user.altura }
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err);
        res.status(500).json({ erro: "Erro interno" });
    }
};

// --- FUNÇÃO 3: TORNAR VIP ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        const user = await Usuario.findOneAndUpdate(
            { whatsapp: String(whatsapp).trim() },
            { pago: true },
            { new: true }
        );
        if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
        res.json({ mensagem: "VIP Ativado!", user });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
};

// --- FUNÇÃO 4: NOVA - OBTER DADOS PARA A HOME ---
export const obterDadosUsuario = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp: String(whatsapp).trim() });

        if (!user) {
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }

        res.json({
            nome: user.nome || "Guerreiro(a)",
            peso: user.peso || "0",
            altura: user.altura || "0",
            meta: user.meta || "Emagrecimento",
            pago: user.pago === true || user.pago === "true"
        });
    } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
};