import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO 1: OBTER HISTÓRICO ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ whatsapp: String(whatsapp).trim() });

        if (!user) return res.json([]);

        const isVip = user.planStatus === 'vip';

        const historicoLimpo = (user.historico || []).map(msg => {
            let texto = msg.content || "";
            if (isVip) {
                // Se virou VIP, limpamos as tags de bloqueio das mensagens antigas
                texto = texto.replace(/\[CONTEÚDO BLOQUEADO\]/g, "✅ (Liberado)");
                texto = texto.replace(/Para ver o resto do seu plano, clique no BOTÃO LARANJA.*/gi, "Aproveite seu acesso VIP! 💪");
            }
            return { role: msg.role === 'assistant' ? 'assistant' : 'user', content: texto };
        });

        res.json(historicoLimpo);
    } catch (err) {
        console.error("ERRO AO BUSCAR HISTÓRICO:", err.message);
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
};

// --- FUNÇÃO 2: PERGUNTA ATUALIZADA (COM BLOQUEIO RÍGIDO) ---
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
                planStatus: 'trial',
                nome: nomeNoPerfil || "Guerreiro(a)",
                peso: "0",
                altura: "0",
                meta: "Definir"
            });
        }

        const isVip = user.planStatus === 'vip';
        const nomeUser = user.nome || "Guerreiro(a)";
        const pesoUser = user.peso && user.peso !== "0" ? `${user.peso}kg` : "não informado";
        const alturaUser = user.altura && user.altura !== "0" ? `${user.altura}m` : "não informada";

        // --- DEFINIÇÃO DO PROMPT (REGRAS DE NEGÓCIO) ---
        let instrucaoSeguranca = `Você é a Ana, nutricionista do TreinoFit. Você conversa com ${nomeUser}.
        Dados atuais: Peso ${pesoUser}, Altura ${alturaUser}.`;

        if (!isVip) {
            instrucaoSeguranca += `
                ### PROTOCOLO DE CONVERSÃO TRIAL (DEGUSTAÇÃO) ###
                1. O usuário ${nomeUser} ainda não é VIP. Sua missão é mostrar autoridade técnica e depois travar o conteúdo.
                2. ESTRUTURA DA RESPOSTA:
                   - Inicie com uma análise profissional curta sobre os dados dele (IMC, TMB ou o que ele perguntou).
                   - Entregue APENAS 30% do que foi pedido (Ex: Apenas o Café da Manhã e 1 exercício de treino).
                   - Na metade da resposta, você deve OBRIGATORIAMENTE interromper o fluxo e inserir a trava.
                
                3. FRASE DE BLOQUEIO OBRIGATÓRIA (NA METADE DA RESPOSTA):
                   "\n\n[CONTEÚDO BLOQUEADO]\n\n${nomeUser}, analisei seu perfil e sua estratégia completa de dieta e treinos de alta performance já está gerada no meu sistema! 🚀
                   
                   Para visualizar o restante do seu plano (Almoço, Jantar, Ceia e Cronograma de Treinos Completo), clique no BOTÃO LARANJA abaixo e ative seu Acesso VIP Premium agora mesmo!"
                
                4. RESTRIÇÃO: Nunca entregue quantidades ou horários de Almoço e Jantar antes da tag [CONTEÚDO BLOQUEADO].
            `;
        } else {
            instrucaoSeguranca += `
                ### MODO VIP LIBERADO ###
                1. O usuário ${nomeUser} é VIP. Forneça planos completos, treinos de alta performance e dietas detalhadas.
                2. NUNCA use a palavra BLOQUEADO.
                3. Seja motivadora e use o nome do usuário: ${nomeUser}.
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

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salva no banco de dados
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        
        // Atualização automática de peso se detectado na mensagem
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

// --- FUNÇÃO 3: TORNAR VIP ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        const user = await Usuario.findOneAndUpdate(
            { whatsapp: String(whatsapp).trim() },
            { planStatus: 'vip' },
            { new: true }
        );
        if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
        res.json({ mensagem: "VIP Ativado!", user });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
};