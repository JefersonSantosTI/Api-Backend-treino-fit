import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO DE PERGUNTA (EXISTENTE COM AJUSTES) ---
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

        // Lógica de Trava: Verifica se é VIP ou TRIAL
        const isTrial = user.planStatus === 'trial' || !user.planStatus;
        let instrucaoSeguranca = "";

        if (isTrial) {
            instrucaoSeguranca = `
                ### REGRA DE SEGURANÇA (MODO TRIAL) ###
                Você é a IA do Treino Fit. O usuário NÃO pagou ainda.
                1. Calcule os Macros Totais.
                2. Detalhe APENAS o Café da Manhã.
                3. OMITA Almoço e Jantar usando: "[CONTEÚDO BLOQUEADO - LIBERE O ACESSO VIP]".
                4. Diga que para ver o resto ele deve clicar no botão laranja de upgrade.
            `;
        } else {
            instrucaoSeguranca = "USUÁRIO VIP: Forneça a dieta completa, treinos e ignore qualquer trava de bloqueio.";
        }

        const historicoParaIA = user.historico
            .filter(msg => msg && msg.content)
            .slice(-10)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content.trim()
            }));

        // Adiciona a pergunta atual
        historicoParaIA.push({ role: 'user', content: mensagemAtual });

        // Adiciona instrução de sistema
        historicoParaIA.unshift({ role: 'system', content: instrucaoSeguranca });

        const respostaIA = await obterRespostaReceitas(historicoParaIA);

        // Salva no banco
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        await user.save();

        res.json({ 
            resposta: respostaIA,
            isTrial: isTrial 
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err.message);
        res.status(500).json({ erro: "Erro ao processar pergunta" });
    }
};

// --- NOVA FUNÇÃO: ATUALIZAR PARA VIP NO BANCO ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        
        const user = await Usuario.findOneAndUpdate(
            { whatsapp: String(whatsapp).trim() },
            { planStatus: 'vip' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }

        res.json({ mensagem: "Status atualizado para VIP com sucesso!", user });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar para VIP" });
    }
};