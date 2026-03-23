import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

export const perguntaReceita = async (req, res) => {
    try {
        // 1. Pegue os dados e garanta que são strings (Sem duplicar variáveis)
        const whatsappRaw = req.body.whatsapp;
        const mensagemRaw = req.body.mensagemAtual;

        const whatsapp = String(whatsappRaw || "").trim();
        const mensagemAtual = String(mensagemRaw || "").trim();

        // Validação inicial
        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ 
                erro: "WhatsApp e mensagem são obrigatórios",
                recebido: { whatsapp, mensagemAtual } 
            });
        }

        // 2. Busca ou cria o usuário no MongoDB
        let user = await Usuario.findOne({ whatsapp });
        
        if (!user) {
            user = await Usuario.create({ whatsapp, historico: [] });
        }

        // 3. Adiciona a mensagem do usuário ao histórico local
        user.historico.push({ role: 'user', content: mensagemAtual });

        // 4. FILTRO DE SEGURANÇA (Remove nulos e garante o formato da OpenAI)
        const historicoParaIA = user.historico
            .filter(msg => msg && msg.content && typeof msg.content === 'string')
            .slice(-10) // Mantém apenas as últimas 10 para não estourar o limite
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content.trim()
            }));

        // 5. Chama a OpenAI através do seu service
        const respostaIA = await obterRespostaReceitas(historicoParaIA);

        // 6. Adiciona a resposta da IA ao histórico e salva no banco
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        await user.save();

        // 7. Responde para o Front-end
        res.json({ resposta: respostaIA });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err.message);
        res.status(500).json({ 
            erro: "Erro interno ao processar sua pergunta", 
            detalhe: err.message 
        });
    }
}