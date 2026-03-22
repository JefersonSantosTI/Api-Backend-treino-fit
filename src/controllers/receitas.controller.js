import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp, mensagemAtual } = req.body;

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "WhatsApp e mensagem são obrigatórios" });
        }

        // --- LÓGICA BLINDADA ---
// 1. Garante que a mensagem atual é uma string
const mensagemTexto = String(mensagemAtual || "").trim();

if (!mensagemTexto) {
    return res.status(400).json({ erro: "Mensagem vazia não é permitida" });
}

// 2. Adiciona ao histórico do objeto local
user.historico.push({ role: 'user', content: mensagemTexto });

// 3. FILTRO CRÍTICO: Remove qualquer mensagem que não tenha 'content' string
const historicoParaIA = user.historico
    .filter(msg => msg && typeof msg.content === 'string' && msg.content.trim() !== "")
    .slice(-10) // Pega as últimas 10
    .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content.trim()
    }));

// 4. Chamada para a OpenAI
const respostaIA = await obterRespostaReceitas(historicoParaIA);

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err.message);
        res.status(500).json({ erro: "Erro interno ao processar IA", detalhe: err.message });
    }
};
