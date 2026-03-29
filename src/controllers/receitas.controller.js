import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO DE PERGUNTA ATUALIZADA ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual: mensagemRaw } = req.body;

        const whatsapp = String(whatsappRaw || "").trim();
        const mensagemAtual = String(mensagemRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "WhatsApp e mensagem são obrigatórios" });
        }

        // 1. Busca ou cria o usuário
        let user = await Usuario.findOne({ whatsapp });
        
        if (!user) {
            user = await Usuario.create({ 
                whatsapp, 
                historico: [], 
                planStatus: 'trial' 
            });
        }

        // 2. Lógica de Trava: Define a instrução baseada no plano
        const isTrial = user.planStatus === 'trial' || !user.planStatus;
        let instrucaoSeguranca = "";

        if (isTrial) {
            // Instrução específica para forçar a IA a disparar o gatilho do botão laranja
            instrucaoSeguranca = `
                ### REGRA DE NEGÓCIO: MODO TRIAL (DEGUSTAÇÃO) ###
                Você é a Ana, assistente do Treino Fit. O usuário ainda não é VIP.
                
                REGRAS OBRIGATÓRIAS:
                1. Calcule e mostre IMC, TMB e ingestão de água.
                2. Detalhe APENAS a primeira refeição (Café da Manhã).
                3. Para Almoço, Lanche e Jantar, escreva exatamente: "[CONTEÚDO BLOQUEADO]".
                4. Finalize a mensagem com esta frase exata: "Para ver o resto do seu plano, clique no BOTÃO LARANJA que apareceu abaixo!"
                
                NÃO forneça a dieta completa sob nenhuma hipótese neste modo.
            `;
        } else {
            instrucaoSeguranca = `
                ### MODO VIP ATIVO ###
                O usuário é VIP. Forneça a dieta completa (24h), treinos detalhados e orientações premium sem restrições.
            `;
        }

        // 3. Formata o histórico para a OpenAI (limite de 10 mensagens para economia)
        const historicoParaIA = user.historico
            .filter(msg => msg && msg.content)
            .slice(-10)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content.trim()
            }));

        // 4. Monta o payload final (System + Histórico + Pergunta Atual)
        const mensagensParaEnviar = [
            { role: 'system', content: instrucaoSeguranca },
            ...historicoParaIA,
            { role: 'user', content: mensagemAtual }
        ];

        // 5. Obtém a resposta da IA
        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // 6. Salva a interação no Banco de Dados
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        await user.save();

        // 7. Retorna a resposta e o status do plano para o Front-end
        res.json({ 
            resposta: respostaIA,
            isTrial: isTrial 
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER PERGUNTA:", err.message);
        res.status(500).json({ erro: "Erro ao processar sua solicitação de treino/dieta" });
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

        if (!user) {
            return res.status(404).json({ erro: "Usuário não encontrado para upgrade" });
        }

        res.json({ 
            mensagem: "Parabéns! Agora você é VIP no Treino Fit.", 
            user 
        });
    } catch (err) {
        console.error("ERRO AO TORNAR VIP:", err.message);
        res.status(500).json({ erro: "Erro ao atualizar status para VIP" });
    }
};