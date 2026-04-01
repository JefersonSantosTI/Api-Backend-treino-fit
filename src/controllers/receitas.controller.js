import { Usuario } from "../controllers/Usuario.js"; // Verifique se o caminho do model está correto
import { obterRespostaReceitas } from "../services/openai.service.js"; // Ou seu serviço de IA

// 1. CHAT E PERGUNTA (Já corrigido com perfilExtraido)
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual: mensagemRaw, perfilExtraido } = req.body;
        const whatsapp = String(whatsappRaw || "").trim();
        const mensagemAtual = String(mensagemRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        let user = await Usuario.findOne({ whatsapp });
        if (!user) {
            user = await Usuario.create({ whatsapp, nome: "Guerreiro(a)", pago: false });
        }

        // Se o front enviou dados minerados, salva no banco agora
        if (perfilExtraido) {
            if (perfilExtraido.nome) user.nome = perfilExtraido.nome;
            if (perfilExtraido.peso) user.peso = String(perfilExtraido.peso).replace(',', '.');
            if (perfilExtraido.altura) user.altura = String(perfilExtraido.altura).replace(',', '.');
        }

        const isVip = user.pago === true || user.pago === "true";
        
        // Aqui deve entrar sua lógica de montar mensagensParaEnviar para a IA
        const mensagensParaEnviar = [
            { role: "system", content: "Você é um nutricionista focado em treinos." },
            ...user.historico.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: mensagemAtual }
        ];

        let respostaIA = await obterRespostaReceitas(mensagensParaEnviar);
        const respostaFormatada = String(respostaIA).trim();

        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaFormatada });
        await user.save();

        res.json({ 
            resposta: respostaFormatada,
            isTrial: !isVip,
            perfilAtualizado: { 
                nome: user.nome, 
                peso: String(user.peso || ""), 
                altura: String(user.altura || "") 
            }
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER PERGUNTA:", err);
        res.status(500).json({ erro: "Erro interno" });
    }
};

// 2. BUSCAR DADOS DO USUÁRIO (A que você acabou de adicionar)
export const obterDadosUsuario = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp });

        if (!user) {
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }

        res.json({
            nome: user.nome,
            peso: user.peso,
            altura: user.altura,
            pago: user.pago,
            historico: user.historico
        });
    } catch (err) {
        console.error("Erro ao obter dados:", err);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
};

// 3. BUSCAR HISTÓRICO (Faltava esta exportação)
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp });
        
        if (!user) return res.json([]);
        
        // Formata para o padrão que o front espera
        const historico = user.historico.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        res.json(historico);
    } catch (err) {
        console.error("Erro histórico:", err);
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
};

// 4. TORNAR VIP (Faltava esta exportação)
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        const user = await Usuario.findOneAndUpdate(
            { whatsapp }, 
            { pago: true }, 
            { new: true }
        );
        res.json({ sucesso: true, user });
    } catch (err) {
        console.error("Erro VIP:", err);
        res.status(500).json({ erro: "Erro ao atualizar para VIP" });
    }
};