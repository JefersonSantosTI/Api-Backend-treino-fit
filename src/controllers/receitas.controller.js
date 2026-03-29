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
            // Criamos como 'trial' por padrão para novos usuários
            user = await Usuario.create({ 
                whatsapp, 
                historico: [], 
                planStatus: 'trial' // Certifique-se de ter esse campo no seu Schema do MongoDB
            });
        }

        // 2. Lógica do Filtro "Primeiro Prato Grátis"
        let instrucaoSeguranca = "";
        const isTrial = user.planStatus === 'trial' || !user.planStatus;

        if (isTrial) {
            instrucaoSeguranca = `
                ### REGRA DE DEGUSTAÇÃO (TRIAL) ###
                O usuário está em modo de teste gratuito. 
                1. Calcule e mostre os Macronutrientes Totais (Kcal, Carboidratos, Proteínas e Gorduras).
                2. Detalhe APENAS a primeira refeição (Café da Manhã).
                3. Para TODAS as outras refeições (Almoço, Lanches, Jantar), escreva EXATAMENTE: "[CONTEÚDO BLOQUEADO - LIBERE O ACESSO VIP]".
                4. Finalize dizendo que ele pode liberar o plano completo no botão abaixo.
            `;
        }

        // 3. Prepara o histórico e injeta a regra de segurança no início para a IA obedecer
        const historicoParaIA = user.historico
            .filter(msg => msg && msg.content)
            .slice(-10)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content.trim()
            }));

        // Adicionamos a instrução de trava como uma mensagem de sistema/contexto
        historicoParaIA.unshift({
            role: 'system',
            content: `Você é a IA do Treino Fit. ${instrucaoSeguranca}`
        });

        // 4. Adiciona a pergunta atual do usuário ao histórico local (antes de salvar)
        user.historico.push({ role: 'user', content: mensagemAtual });

        // 5. Chama a OpenAI
        const respostaIA = await obterRespostaReceitas(historicoParaIA);

        // 6. Salva a resposta e o histórico
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        await user.save();

        // 7. Responde para o Front-end enviando o status do plano
        // Assim o Front sabe se deve aplicar o efeito de "Blur" (borrão) ou não
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