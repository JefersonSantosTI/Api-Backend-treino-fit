import obterRespostaReceitas from '../services/openai.service.js';
import Usuario from './Usuario.js';

// --- FUNÇÃO DE PERGUNTA ATUALIZADA (DINÂMICA POR USUÁRIO) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual: mensagemRaw, nomeNoPerfil } = req.body;
        const whatsapp = String(whatsappRaw || "").trim();
        const mensagemAtual = String(mensagemRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "WhatsApp e mensagem são obrigatórios" });
        }

        // Tenta encontrar o usuário
        let user = await Usuario.findOne({ whatsapp });
        
        // Se não existir, cria um NOVO usando o nome que veio do Front-end (ou um genérico temporário)
        if (!user) {
            user = await Usuario.create({ 
                whatsapp, 
                historico: [], 
                planStatus: 'trial',
                nome: nomeNoPerfil || "Guerreiro(a)", // Pega o nome real do cadastro ou usa genérico
                peso: "0",
                altura: "0",
                meta: "Definir"
            });
        }

        const isVip = user.planStatus === 'vip';
        const statusTexto = isVip ? 'VIP' : 'TRIAL';

        // --- DADOS DINÂMICOS DO BANCO ---
        const nomeUser = user.nome || "Guerreiro(a)";
        const pesoUser = user.peso && user.peso !== "0" ? `${user.peso}kg` : "não informado";
        const alturaUser = user.altura && user.altura !== "0" ? `${user.altura}m` : "não informada";

        // Instrução para a IA ser a "Ana" e usar o nome correto
        let instrucaoSeguranca = `Você é a Ana, nutricionista do TreinoFit. 
        Você está conversando com: ${nomeUser}.
        Dados atuais: Peso ${pesoUser}, Altura ${alturaUser}.`;

        if (!isVip) {
            instrucaoSeguranca += `
                ### MODO TRIAL ###
                REGRAS: 
                1. Libere APENAS o Café da Manhã. 
                2. Para Almoço ou Jantar, responda estritamente: "[CONTEÚDO BLOQUEADO]".
                3. Finalize dizendo que ele precisa do Plano VIP para liberar o resto.
            `;
        } else {
            instrucaoSeguranca += `
                ### MODO VIP TOTAL ###
                REGRAS:
                1. O usuário ${nomeUser} é VIP. Libere dietas e treinos COMPLETOS.
                2. Nunca use a palavra "BLOQUEADO".
                3. Seja motivadora e chame-o(a) pelo nome: ${nomeUser}.
            `;
        }

        // --- HISTÓRICO RECENTE ---
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

        // Salvar no banco
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: String(respostaIA) });
        
        // Lógica simples para atualizar peso se ele disser "estou com 80kg"
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