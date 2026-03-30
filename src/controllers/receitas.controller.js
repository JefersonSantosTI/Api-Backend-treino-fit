import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO PARA BUSCAR HISTÓRICO ---
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
            return { role: msg.role, content: texto };
        });

        res.json(historicoLimpo);
    } catch (err) {
        console.error("ERRO AO BUSCAR HISTÓRICO:", err.message);
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
};

// --- FUNÇÃO DE PERGUNTA ATUALIZADA (BLINDADA CONTRA AMNÉSIA) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual: mensagemRaw } = req.body;
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
                nome: "Jeferson", // Nome padrão para evitar perguntas
                peso: "100",
                altura: "1.82",
                meta: "Emagrecimento"
            });
        }

        const isVip = user.planStatus === 'vip';
        const statusTexto = isVip ? 'VIP' : 'TRIAL';

        // --- DADOS REAIS PARA INJETAR NO CÉREBRO DA IA ---
        const pesoUser = user.peso && user.peso !== "0" ? user.peso : "100";
        const alturaUser = user.altura && user.altura !== "0" ? user.altura : "1.82";
        const nomeUser = user.nome || "Jeferson";

        let instrucaoSeguranca = "";
        if (!isVip) {
            instrucaoSeguranca = `
                ### MODO TRIAL ###
                Você é a Ana. 
                DADOS: ${nomeUser}, ${pesoUser}kg.
                REGRAS: 
                1. JAMAIS peça dados (nome/peso/altura), você já tem!
                2. Libere APENAS o Café da Manhã. 
                3. Almoço/Jantar use: "[CONTEÚDO BLOQUEADO]".
                4. Finalize mandando clicar no botão laranja.
            `;
        } else {
            instrucaoSeguranca = `
                ### MODO VIP TOTAL ###
                Você é a Ana. O usuário ${nomeUser} é VIP.
                DADOS: ${pesoUser}kg, ${alturaUser}m.
                REGRAS ABSOLUTAS:
                1. NÃO peça nome, peso, altura ou idade. Use os dados acima.
                2. PROIBIDO usar "BLOQUEADO". Entregue dieta e treinos COMPLETOS.
                3. Se ele disser "Oi", seja direta: "Olá ${nomeUser}! Como posso ajudar no seu treino hoje?"
                4. Não seja repetitiva. Se ele já tem a dieta, sugira ajustes ou treinos.
            `;
        }

        // --- FILTRO DE HISTÓRICO (Pega apenas as últimas 5 para não "poluir" a regra VIP) ---
        let historicoParaIA = (user.historico || [])
            .filter(msg => msg && msg.content && !msg.content.includes("Olá")) // Remove os "olás" inúteis do histórico
            .slice(-5) 
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

        // Injetamos o contexto de Peso e VIP na própria pergunta atual
        const promptFinal = `[CONTEXTO: ${nomeUser}, ${pesoUser}kg, STATUS: ${statusTexto}]. Pergunta: ${mensagemAtual}`;

        const mensagensParaEnviar = [
            { role: 'system', content: instrucaoSeguranca },
            ...historicoParaIA,
            { role: 'user', content: promptFinal }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salvar histórico limpo
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        
        // Se o usuário digitou um peso novo na conversa, atualizamos o banco silenciosamente
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

// --- FUNÇÃO PARA TORNAR VIP ---
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