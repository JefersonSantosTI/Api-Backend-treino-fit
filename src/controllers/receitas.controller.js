import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

export const perguntaReceita = async (req, res) => {
    try {
        const whatsappRaw = req.body.whatsapp;
        const mensagemRaw = req.body.mensagemAtual;

        const whatsapp = String(whatsappRaw || "").trim();
        const mensagemAtual = String(mensagemRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ 
                erro: "WhatsApp e mensagem são obrigatórios" 
            });
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

        // 2. Lógica do Filtro "Primeiro Prato Grátis"
        const isTrial = user.planStatus === 'trial' || !user.planStatus;
        let instrucaoSeguranca = "";

        if (isTrial) {
            instrucaoSeguranca = `
                ### REGRA DE DEGUSTAÇÃO (TRIAL) ###
                Você é a IA do Treino Fit. O usuário está em modo TRIAL (Gratuito).
                1. Calcule Macros Totais.
                2. Detalhe APENAS o Café da Manhã.
                3. Bloqueie as outras refeições com: "[CONTEÚDO BLOQUEADO - LIBERE O ACESSO VIP]".
                4. Se o usuário pedir para liberar ou ver o resto, diga que ele deve clicar no botão laranja abaixo.
            `;
        } else {
            instrucaoSeguranca = "O usuário é VIP. Forneça a dieta completa e detalhada de todas as refeições.";
        }

        // 3. Prepara o histórico (Últimas 10 mensagens)
        const historicoParaIA = user.historico
            .filter(msg => msg && msg.content)
            .slice(-10)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content.trim()
            }));

        // 4. CORREÇÃO: Adiciona a mensagem ATUAL do usuário ao array que vai para a OpenAI
        historicoParaIA.push({
            role: 'user',
            content: mensagemAtual
        });

        // 5. Adiciona a instrução de sistema no TOPO
        historicoParaIA.unshift({
            role: 'system',
            content: instrucaoSeguranca
        });

        // 6. Chama a OpenAI
        const respostaIA = await obterRespostaReceitas(historicoParaIA);

        // 7. Salva TUDO no banco de dados (A pergunta e a resposta)
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        await user.save();

        // 8. Responde para o Front-end
        res.json({ 
            resposta: respostaIA,
            isTrial: isTrial 
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err.message);
        res.status(500).json({ 
            erro: "Erro interno ao processar sua pergunta", 
            detalhe: err.message 
        });
    }
}