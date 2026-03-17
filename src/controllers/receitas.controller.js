import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';// Importe o modelo que criamos

export const perguntaReceita = async (req, res) => {
    try {
        // Agora precisamos do ID do usuário (pode ser o número do WhatsApp ou um e-mail)
        const { whatsapp, mensagemAtual } = req.body;

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "WhatsApp e mensagem são obrigatórios" });
        }

        // --- LÓGICA DE BUSCA NO BANCO ---
        // 1. Busca o usuário pelo WhatsApp. Se não existir, cria um novo.
        let user = await Usuario.findOne({ whatsapp });

        if (!user) {
            user = await Usuario.create({ 
                whatsapp, 
                historico: [] 
            });
        }

       // 2. Garanta que a mensagem atual seja uma string limpa
const mensagemTexto = String(mensagemAtual).trim();

// Adiciona ao histórico do banco
user.historico.push({ role: 'user', content: mensagemTexto });

// --- CHAMADA PARA A OPENAI ---
// 3. Filtre o histórico para garantir que NENHUM item seja nulo ou inválido
const historicoLimpo = user.historico
    .filter(msg => msg.content && typeof msg.content === 'string')
    .map(msg => ({
        role: msg.role,
        content: msg.content
    }));

const respostaIA = await obterRespostaReceitas(historicoLimpo);

// ... (resto do seu código de salvar e responder)

        // 4. Adiciona a resposta da IA ao histórico do banco
        user.historico.push({ role: 'assistant', content: respostaIA });

        // 5. Salva tudo no MongoDB
        await user.save();

        // 6. Responde para o cliente
        res.json({ resposta: respostaIA });

    } catch (err) {
        console.error("Erro detalhado:", err);
        res.status(500).json({
            erro: "Erro ao processar sua pergunta, tente novamente"
        });
    }
};

 
