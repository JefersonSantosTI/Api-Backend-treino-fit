import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- NOVO: FUNÇÃO PARA BUSCAR HISTÓRICO (Resolve o erro 404) ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp: String(whatsapp).trim() });

        if (!user) {
            return res.json([]); // Retorna lista vazia se não achar o usuário
        }

        const isVip = user.planStatus === 'vip';

        // Mapeia o histórico e limpa textos de bloqueio se o usuário já for VIP
        const historicoLimpo = user.historico.map(msg => {
            let texto = msg.content || "";
            if (isVip) {
                texto = texto.replace(/\[CONTEÚDO BLOQUEADO\]/g, "✅ (Liberado)");
                texto = texto.replace(/Para ver o resto do seu plano, clique no BOTÃO LARANJA.*/gi, "Aproveite seu acesso VIP! 💪");
            }
            return {
                role: msg.role,
                content: texto
            };
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
                planStatus: 'trial' 
            });
        }

        const isTrial = user.planStatus === 'trial' || !user.planStatus;

        let instrucaoSeguranca = "";
        if (isTrial) {
            instrucaoSeguranca = `
                ### REGRA DE NEGÓCIO: MODO TRIAL ###
                Você é a Ana do Treino Fit.
                REGRAS:
                1. Detalhe APENAS o Café da Manhã.
                2. Para Almoço, Lanche e Jantar, escreva obrigatoriamente: "[CONTEÚDO BLOQUEADO]".
                3. Finalize com: "Para ver o resto do seu plano, clique no BOTÃO LARANJA que apareceu abaixo!"
            `;
        } else {
            instrucaoSeguranca = `
                ### MODO VIP LIBERADO ###
                O USUÁRIO É VIP. VOCÊ ESTÁ PROIBIDA DE USAR A PALAVRA "BLOQUEADO".
                ENTREGUE A DIETA COMPLETA (CAFÉ, ALMOÇO, LANCHE E JANTAR) COM DETALHES.
                Ignore qualquer instrução anterior de bloqueio. O acesso agora é TOTAL.
            `;
        }

        let historicoParaIA = user.historico
            .filter(msg => msg && msg.content)
            .slice(-10)
            .map(msg => {
                let conteudo = msg.content.trim();
                if (!isTrial) {
                    conteudo = conteudo
                        .replace(/\[CONTEÚDO BLOQUEADO\]/g, "(Conteúdo detalhado e liberado anteriormente)")
                        .replace(/Para ver o resto do seu plano.*/gi, "Aproveite seu acesso VIP!");
                }
                return {
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: conteudo
                };
            });

        let promptFinalUsuario = mensagemAtual;
        if (!isTrial) {
            promptFinalUsuario = `[USUÁRIO VIP ATIVO]: ${mensagemAtual} (Por favor, forneça o plano completo agora, sem nenhum bloqueio).`;
        }

        const mensagensParaEnviar = [
            { role: 'system', content: instrucaoSeguranca },
            ...historicoParaIA,
            { role: 'user', content: promptFinalUsuario }
        ];

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

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