import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './src/Usuario.js';// Importe o modelo que criamos

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

        // 2. Adiciona a nova mensagem do usuário ao histórico dele no banco
        user.historico.push({ role: 'user', content: mensagemAtual });

        // --- CHAMADA PARA A OPENAI ---
        // 3. Enviamos TODO o histórico recuperado para a IA ter memória
        const respostaIA = await obterRespostaReceitas(user.historico);

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

 
