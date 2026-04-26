import Usuario from "./Usuario.js"; 
import obterRespostaReceitas from "../services/openai.service.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. CHAT NUTRIÇÃO (Lógica de Texto e Biometria) ---
export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        const whatsapp = String(whatsappRaw || "").trim();

        if (!whatsapp || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados obrigatórios faltando" });
        }

        // Busca ou cria o usuário
        let user = await Usuario.findOne({ WhatsApp: whatsapp });
        if (!user) {
            user = await Usuario.create({ WhatsApp: whatsapp, nome: "Guerreiro(a)", pago: false });
        }

        // Atualiza biometria se a IA detectou peso/altura no texto do chat
        if (perfilExtraido) {
            if (!user.dadosBiometricos) user.dadosBiometricos = {};
            if (perfilExtraido.nome) user.nome = perfilExtraido.nome;
            if (perfilExtraido.peso) {
                user.dadosBiometricos.peso = Number(String(perfilExtraido.peso).replace(',', '.'));
            }
            if (perfilExtraido.altura) {
                user.dadosBiometricos.altura = Number(String(perfilExtraido.altura).replace(',', '.'));
            }
        }

        // Prepara histórico para manter o contexto do chat
        const mensagensParaEnviar = [
            { role: "system", content: "Você é um nutricionista esportivo de alta performance. Sua missão é montar dietas e tirar dúvidas nutricionais." },
            ...user.historico.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: mensagemAtual }
        ];

        // Chama o serviço de IA para Nutrição (Retorna Texto)
        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar);

        // Salva interação no histórico
        user.historico.push({ role: 'user', content: mensagemAtual });
        user.historico.push({ role: 'assistant', content: respostaIA });
        
        user.markModified('historico');
        user.markModified('dadosBiometricos');
        await user.save();

        res.json({ 
            resposta: respostaIA,
            perfilAtualizado: { 
                nome: user.nome, 
                peso: user.dadosBiometricos?.peso || "", 
                altura: user.dadosBiometricos?.altura || "" 
            }
        });

    } catch (err) {
        console.error("ERRO CHAT NUTRI:", err);
        res.status(500).json({ erro: "Erro ao processar consulta nutricional." });
    }
};

// --- 2. MENTOR DE TREINO IA (Lógica de JSON Puro para Cards) ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfil } = req.body;

        if (!whatsapp || !objetivo) {
            return res.status(400).json({ erro: "WhatsApp e Objetivo são necessários." });
        }

        // Prompt focado 100% em ser um Personal Trainer que gera dados para o Front-end
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Você é um Personal Trainer IA de alta performance. 
                    Gere treinos técnicos baseados no objetivo e perfil do aluno.
                    REGRA CRÍTICA: Responda APENAS um objeto JSON. Não escreva textos antes ou depois.
                    
                    FORMATO DO JSON:
                    {
                      "treino": [
                        {"nome": "Nome do Exercício", "series": "3", "reps": "12", "obs": "Dica técnica curta"},
                        {"nome": "Próximo Exercício", "series": "4", "reps": "10", "obs": "Dica de execução"}
                      ]
                    }` 
                },
                { 
                    role: "user", 
                    content: `Gere um treino de ${objetivo}. Aluno: ${perfil?.peso || '70'}kg e ${perfil?.altura || '1.70'}m.` 
                }
            ],
            response_format: { type: "json_object" }
        });

        const treinoData = JSON.parse(completion.choices[0].message.content);

        // Salva o treino gerado no campo treinoCustomizado para persistência
        await Usuario.findOneAndUpdate(
            { WhatsApp: whatsapp },
            { treinoCustomizado: JSON.stringify(treinoData.treino) }
        );

        res.json(treinoData);
    } catch (err) {
        console.error("ERRO GERADOR TREINO:", err);
        res.status(500).json({ erro: "Falha ao gerar treino técnico." });
    }
};

// --- 3. DADOS DO USUÁRIO ---
export const obterDadosUsuario = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: whatsapp });
        
        if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });

        res.json({
            nome: user.nome,
            peso: user.dadosBiometricos?.peso,
            altura: user.dadosBiometricos?.altura,
            pago: user.pago,
            treinoIA: user.treinoCustomizado ? JSON.parse(user.treinoCustomizado) : null, 
            historico: user.historico
        });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao obter perfil" });
    }
};

// --- 4. HISTÓRICO DE CHAT ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: whatsapp });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar histórico" });
    }
};

// --- 5. ATIVAÇÃO VIP ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        await Usuario.findOneAndUpdate({ WhatsApp: whatsapp }, { pago: true });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao ativar acesso VIP" });
    }
};