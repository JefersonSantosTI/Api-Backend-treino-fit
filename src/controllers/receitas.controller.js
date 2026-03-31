import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO 1: OBTER HISTÓRICO ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp: String(whatsapp).trim() });

        if (!user) return res.json([]);

        // AJUSTE: Lendo o campo 'pago' do seu banco de dados
        const isVip = user.pago === true || user.pago === "true";

        const historicoLimpo = (user.historico || []).map(msg => {
            let texto = msg.content || "";
            if (isVip) {
                // Limpa o histórico antigo para o VIP não ver mensagens de bloqueio
                texto = texto.replace(/\[CONTEÚDO BLOQUEADO\]/g, "✅ (Liberado)");
                texto = texto.replace(/Para visualizar o restante do seu plano.*/gi, "Aproveite seu acesso VIP! 💪");
                texto = texto.replace(/clique no BOTÃO LARANJA.*/gi, "Plano completo liberado.");
            }
            return { role: msg.role === 'assistant' ? 'assistant' : 'user', content: texto };
        });

        res.json(historicoLimpo);
    } catch (err) {
        console.error("ERRO AO BUSCAR HISTÓRICO:", err.message);
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
};

// --- FUNÇÃO 2: PERGUNTA COM LIMPEZA DE SEGURANÇA ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual: mensagemRaw, nomeNoPerfil } = req.body;
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
                pago: false, // Campo correto conforme seu banco
                nome: nomeNoPerfil || "Guerreiro(a)",
                peso: "0",
                altura: "0",
                meta: "Definir"
            });
        }

        // AJUSTE: Lendo o campo 'pago'
        const isVip = user.pago === true || user.pago === "true";
        const nomeUser = user.nome || "Guerreiro(a)";
        const pesoUser = user.peso && user.peso !== "0" ? `${user.peso}kg` : "não informado";
        const alturaUser = user.altura && user.altura !== "0" ? `${user.altura}m` : "não informada";

        let instrucaoSeguranca = `Você é a Ana, nutricionista do TreinoFit. Você conversa com ${nomeUser}.
        Dados atuais: Peso ${pesoUser}, Altura ${alturaUser}.`;

        if (!isVip) {
            instrucaoSeguranca += `
                ### PROTOCOLO DE CONVERSÃO TRIAL (DEGUSTAÇÃO) ###
                1. O usuário ${nomeUser} ainda não é VIP. Sua missão é mostrar autoridade técnica e depois travar o conteúdo.
                2. Na metade da resposta, você deve OBRIGATORIAMENTE inserir:
                
                [CONTEÚDO BLOQUEADO]
                
                ${nomeUser}, analisei seu perfil e sua estratégia completa já está gerada! 🚀
                Para visualizar o restante do seu plano, clique no BOTÃO LARANJA abaixo e ative seu Acesso VIP!
            `;
        } else {
            instrucaoSeguranca += `
                ### MODO VIP LIBERADO ###
                1. O usuário ${nomeUser} é VIP. Forneça planos COMPLETOS e DETALHADOS.
                2. NUNCA use a palavra BLOQUEADO ou peça para clicar em botão.
            `;
        }

        let historicoParaIA = (user.historico || [])
            .slice(-6) 
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

        const mensagensParaEnviar = [
            { role: 'system', content: instrucaoSeguranca },
            ...historicoParaIA,
            { role: 'user', content: mensagemAtual }
        ];

        let respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // --- TRAVA DE SEGURANÇA FINAL ---
        // Se for VIP, removemos qualquer erro da IA que mencione bloqueio
        if (isVip) {
            respostaIA = String(respostaIA)
                .replace(/\[CONTEÚDO BLOQUEADO\]/gi, "")
                .replace(/Para visualizar o restante do seu plano.*/gi, "")
                .replace(/clique no BOTÃO LARANJA.*/gi, "")
                .trim();
        }

        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        
        const encontrouPeso = mensagemAtual.match(/(\d+)\s*kg/i);
        if (encontrouPeso) user.peso = encontrouPeso[1];

        await user.save();

        res.json({ 
            resposta: respostaIA,
            isTrial: !isVip 
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err);
        res.status(500).json({ erro: "Erro interno" });
    }
};

// --- FUNÇÃO 3: TORNAR VIP (ATUALIZADA PARA CAMPO 'PAGO') ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        const user = await Usuario.findOneAndUpdate(
            { whatsapp: String(whatsapp).trim() },
            { pago: true }, // Agora atualiza o campo certo
            { new: true }
        );
        if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
        res.json({ mensagem: "VIP Ativado!", user });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
};