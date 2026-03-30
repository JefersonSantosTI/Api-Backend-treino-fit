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

// --- FUNÇÃO DE PERGUNTA ATUALIZADA ---
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
                nome: "Cliente",
                peso: "0",
                altura: "0",
                meta: "Emagrecimento"
            });
        }

        const statusAtual = user.planStatus || 'trial';
        const isTrial = statusAtual === 'trial';

        // --- PROTEÇÃO DE DADOS (Evita erro 500 se o campo for nulo) ---
        const pesoUser = user.peso || "Não informado";
        const alturaUser = user.altura || "Não informada";
        const nomeUser = user.nome || "Guerreiro(a)";
        const metaUser = user.meta || "Emagrecimento";

        const infoUsuario = `
            NOME DO USUÁRIO: ${nomeUser}
            PESO ATUAL: ${pesoUser}kg
            ALTURA: ${alturaUser}m
            META: ${metaUser}
        `;

        let instrucaoSeguranca = "";
        if (isTrial) {
            instrucaoSeguranca = `
                ### REGRA DE NEGÓCIO: MODO TRIAL ###
                Você é a Ana do Treino Fit. 
                DADOS DO PERFIL: ${infoUsuario}
                REGRAS:
                1. JAMAIS peça nome, peso ou altura. Use os dados acima.
                2. Detalhe APENAS o Café da Manhã.
                3. Para Almoço, Lanche e Jantar, escreva obrigatoriamente: "[CONTEÚDO BLOQUEADO]".
                4. Finalize incentivando o upgrade para o VIP.
            `;
        } else {
            instrucaoSeguranca = `
                ### MODO VIP LIBERADO ###
                DADOS DO PERFIL: ${infoUsuario}
                O USUÁRIO É VIP. ENTREGUE TUDO COMPLETO.
                Use o peso de ${pesoUser}kg para cálculos.
                Não peça dados novamente.
            `;
        }

        let historicoParaIA = (user.historico || [])
            .filter(msg => msg && msg.content)
            .slice(-10)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

        // --- CORREÇÃO DO ERRO 500 AQUI ---
        // Usamos statusAtual direto para evitar o erro de toUpperCase() em campo nulo
        const promptFinalComContexto = `[CONTEXTO: Peso ${pesoUser}kg, Status ${statusAtual.toUpperCase()}]. Usuário: ${mensagemAtual}`;

        const mensagensParaEnviar = [
            { role: 'system', content: instrucaoSeguranca },
            ...historicoParaIA,
            { role: 'user', content: promptFinalComContexto }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salvar no histórico
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        await user.save();

        res.json({ 
            resposta: respostaIA,
            isTrial: isTrial 
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER PERGUNTA:", err);
        res.status(500).json({ erro: "Erro interno no servidor" });
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