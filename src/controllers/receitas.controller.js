import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO 1: OBTER HISTÓRICO (ESTAVA FALTANDO!) ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp: String(whatsapp).trim() });

        if (!user) return res.json([]);

        const isVip = user.planStatus === 'vip';

        const historicoLimpo = (user.historico || []).map(msg => {
            let texto = msg.content || "";
            if (isVip) {
                texto = texto.replace(/\[CONTEÚDO BLOQUEADO\]/g, "✅ (Liberado)");
                texto = texto.replace(/Para ver o resto do seu plano, clique no BOTÃO LARANJA.*/gi, "Aproveite seu acesso VIP! 💪");
            }
            return { role: msg.role === 'assistant' ? 'assistant' : 'user', content: texto };
        });

        res.json(historicoLimpo);
    } catch (err) {
        console.error("ERRO AO BUSCAR HISTÓRICO:", err.message);
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
};

// --- FUNÇÃO 2: PERGUNTA ATUALIZADA (DINÂMICA) ---
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
                planStatus: 'trial',
                nome: nomeNoPerfil || "Guerreiro(a)",
                peso: "0",
                altura: "0",
                meta: "Definir"
            });
        }

        const isVip = user.planStatus === 'vip';
        const statusTexto = isVip ? 'VIP' : 'TRIAL';

        const nomeUser = user.nome || "Guerreiro(a)";
        const pesoUser = user.peso && user.peso !== "0" ? `${user.peso}kg` : "não informado";
        const alturaUser = user.altura && user.altura !== "0" ? `${user.altura}m` : "não informada";

        let instrucaoSeguranca = `Você é a Ana, nutricionista do TreinoFit. 
        Você está conversando com: ${nomeUser}.
        Dados atuais: Peso ${pesoUser}, Altura ${alturaUser}.`;

        if (!isVip) {
            instrucaoSeguranca += `
                ### MODO TRIAL ###
                REGRAS: 
                1. Libere APENAS o Café da Manhã. 
                2. Para Almoço ou Jantar, responda estritamente: "[CONTEÚDO BLOQUEADO]".
                3. Finalize dizendo que ele precisa do Plano VIP para liberar o resto.
            `;
        } else {
            instrucaoSeguranca += `
                ### MODO VIP TOTAL ###
                REGRAS:
                1. O usuário ${nomeUser} é VIP. Libere dietas e treinos COMPLETOS.
                2. Nunca use a palavra "BLOQUEADO".
                3. Seja motivadora e chame-o(a) pelo nome: ${nomeUser}.
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

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        
        const encontrouPeso = mensagemAtual.match(/(\d+)\s*kg/i);
        if (encontrouPeso) user.peso = encontrouPeso[1];

        await user.save();

        res.json({ 
            resposta: respostaIA,
            isTrial: !isVip 
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err);
        res.status(500).json({ erro: "Erro interno" });
    }
};

// --- FUNÇÃO 3: TORNAR VIP (PARA O FLUXO DE PAGAMENTO) ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        const user = await Usuario.findOneAndUpdate(
            { whatsapp: String(whatsapp).trim() },
            { planStatus: 'vip' },
            { new: true }
        );
        if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
        res.json({ mensagem: "VIP Ativado!", user });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
};