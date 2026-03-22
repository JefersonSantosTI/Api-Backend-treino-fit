import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp, mensagemAtual } = req.body;

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "WhatsApp e mensagem são obrigatórios" });
        }

        // 1. Busca ou cria usuário
        let user = await Usuario.findOne({ whatsapp });
        if (!user) {
            user = await Usuario.create({ whatsapp, historico: [] });
        }

        // 2. Limpeza e preparação do histórico
        const mensagemTexto = String(mensagemAtual).trim();
        user.historico.push({ role: 'user', content: mensagemTexto });

        // Pegar apenas as últimas 10 mensagens para não estourar o limite da OpenAI
        const historicoParaIA = user.historico
            .slice(-10)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: String(msg.content)
            }));

        // 3. Chamada para a OpenAI (Certifique-se que o service está correto)
        const respostaIA = await obterRespostaReceitas(historicoParaIA);

        // 4. Salva a resposta e atualiza o banco
        user.historico.push({ role: 'assistant', content: respostaIA });
        await user.save();

        res.json({ resposta: respostaIA });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err.message);
        res.status(500).json({ erro: "Erro interno ao processar IA", detalhe: err.message });
    }
};
