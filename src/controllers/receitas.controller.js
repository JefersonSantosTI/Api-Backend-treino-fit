import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO PARA BUSCAR HISTÓRICO ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp: String(whatsapp).trim() });

        if (!user) return res.json([]);

        const isVip = user.planStatus === 'vip';

        const historicoLimpo = user.historico.map(msg => {
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

// --- FUNÇÃO DE PERGUNTA ATUALIZADA (COM DADOS DE PERFIL) ---
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
                planStatus: 'trial' 
            });
        }

        const isTrial = user.planStatus === 'trial' || !user.planStatus;

        // --- NOVO: CONSTRUÇÃO DOS DADOS DE PERFIL PARA A IA ---
        // Aqui pegamos os dados reais do banco para a IA não inventar ou perguntar
        const infoUsuario = `
            NOME DO USUÁRIO: ${user.nome || "Cliente"}
            PESO ATUAL: ${user.peso || "Não informado"}kg
            ALTURA: ${user.altura || "Não informada"}m
            META: ${user.meta || "Emagrecimento"}
        `;

        let instrucaoSeguranca = "";
        if (isTrial) {
            instrucaoSeguranca = `
                ### REGRA DE NEGÓCIO: MODO TRIAL ###
                Você é a Ana do Treino Fit. 
                DADOS DO PERFIL: ${infoUsuario}
                
                REGRAS:
                1. JAMAIS peça nome, peso, altura ou WhatsApp, você já tem esses dados acima.
                2. Detalhe APENAS o Café da Manhã.
                3. Para Almoço, Lanche e Jantar, escreva obrigatoriamente: "[CONTEÚDO BLOQUEADO]".
                4. Finalize com: "Para ver o resto do seu plano, clique no BOTÃO LARANJA que apareceu abaixo!"
            `;
        } else {
            instrucaoSeguranca = `
                ### MODO VIP LIBERADO ###
                DADOS DO PERFIL: ${infoUsuario}
                O USUÁRIO É VIP. VOCÊ ESTÁ PROIBIDA DE USAR A PALAVRA "BLOQUEADO".
                ENTREGUE A DIETA E TREINOS COMPLETOS COM DETALHES.
                Use os dados de peso (${user.peso}kg) para todos os cálculos de macros e IMC.
                JAMAIS peça os dados de perfil novamente, você já os possui.
            `;
        }

        let historicoParaIA = user.historico
            .filter(msg => msg && msg.content)
            .slice(-10)
            .map(msg => {
                let conteudo = msg.content.trim();
                if (!isTrial) {
                    conteudo = conteudo
                        .replace(/\[CONTEÚDO BLOQUEADO\]/g, "(Conteúdo liberado anteriormente)")
                        .replace(/Para ver o resto do seu plano.*/gi, "Aproveite seu acesso VIP!");
                }
                return {
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: conteudo
                };
            });

        // Forçamos a IA a ler os dados corretos na última mensagem para evitar que ela use pesos antigos do histórico
        const promptFinalComContexto = `[CONTEXTO ATUAL: Peso ${user.peso}kg, Status ${user.planStatus.toUpperCase()}]. Usuário diz: ${mensagemAtual}`;

        const mensagensParaEnviar = [
            { role: 'system', content: instrucaoSeguranca },
            ...historicoParaIA,
            { role: 'user', content: promptFinalComContexto }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salvamos a mensagem original do usuário (sem o prefixo de contexto) para o histórico ficar limpo
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        await user.save();

        res.json({ 
            resposta: respostaIA,
            isTrial: isTrial 
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER PERGUNTA:", err.message);
        res.status(500).json({ erro: "Erro ao processar sua solicitação" });
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

        res.json({ mensagem: "Parabéns! Agora você é VIP no Treino Fit.", user });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
};