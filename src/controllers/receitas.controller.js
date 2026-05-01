import Usuario from "../controllers/Usuario.js"
import obterRespostaReceitas from "../services/openai.service.js";
import gerarDadosTreino from "../services/geradorTreinoIA.js"; 

export const perguntaReceita = async (req, res) => {
    try {
        const { whatsapp: whatsappRaw, mensagemAtual, perfilExtraido } = req.body;
        const whatsLimpo = String(whatsappRaw || "").replace(/\D/g, "").trim();

        if (!whatsLimpo || !mensagemAtual) {
            return res.status(400).json({ erro: "Dados faltando" });
        }

        let user = await Usuario.findOne({ WhatsApp: whatsLimpo }) || await Usuario.findOne({ whatsapp: whatsLimpo });

        if (!user) {
            user = new Usuario({ WhatsApp: whatsLimpo, nome: "Guerreiro(a)", pago: false, historico: [] });
        }

        // --- BUSCA DE DADOS ---
        const NOME_FINAL = perfilExtraido?.nome || user.nome || "Guerreiro(a)";
        const PESO_FINAL = Number(perfilExtraido?.peso || user.peso || user.dadosBiometricos?.peso || 75);
        const ALTURA_FINAL = Number(perfilExtraido?.altura || user.altura || user.dadosBiometricos?.altura || 1.75);
        const META_FINAL = perfilExtraido?.meta || user.meta || user.dadosBiometricos?.meta || "Emagrecimento";
        const IDADE_FINAL = Number(perfilExtraido?.idade || user.idade || user.dadosBiometricos?.idade || 25);

        const mensagensParaEnviar = (user.historico || []).slice(-6).map(h => ({
            role: h.role || "user",
            content: h.content || ""
        }));

        mensagensParaEnviar.push({ role: "user", content: mensagemAtual });

        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar, {
            nome: NOME_FINAL, 
            peso: PESO_FINAL, 
            altura: ALTURA_FINAL, 
            meta: META_FINAL,
            idade: IDADE_FINAL 
        });

        user.historico.push({ role: 'user', content: mensagemAtual }, { role: 'assistant', content: respostaIA });
        user.markModified('historico');
        await user.save();

        res.json({ 
            resposta: respostaIA, 
            perfilAtualizado: { 
                nome: NOME_FINAL, peso: PESO_FINAL, altura: ALTURA_FINAL, idade: IDADE_FINAL 
            } 
        });
    } catch (err) {
        console.error("❌ ERRO NO CHAT:", err.message);
        res.status(200).json({ resposta: "Tive um soluço técnico, mas já recuperei seus dados. Pode perguntar de novo!" });
    }
};

// --- 2. MENTOR DE TREINO IA ---
export const gerarTreinoIA = async (req, res) => {
    try {
        const { whatsapp, objetivo, perfilExtraido } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        const user = await Usuario.findOne({ WhatsApp: whatsappLimpo }) || await Usuario.findOne({ whatsapp: whatsappLimpo });

        const dadosParaIA = {
            nome: perfilExtraido?.nome || user?.nome || "Guerreiro",
            peso: Number(perfilExtraido?.peso || user?.peso || user?.dadosBiometricos?.peso || 75),
            altura: Number(perfilExtraido?.altura || user?.altura || user?.dadosBiometricos?.altura || 1.75),
            idade: Number(perfilExtraido?.idade || user?.idade || user?.dadosBiometricos?.idade || 25),
            meta: perfilExtraido?.meta || user?.meta || objetivo || "Performance"
        };

        const treinoData = await gerarDadosTreino(dadosParaIA.meta, dadosParaIA);

        if (user) {
            user.treinoCustomizado = JSON.stringify(treinoData);
            user.markModified('treinoCustomizado');
            await user.save();
        }

        res.json(treinoData);
    } catch (err) {
        console.error("❌ ERRO TREINO:", err.message);
        res.status(500).json({ erro: "Falha ao gerar treino técnico." });
    }
};

// --- 3. DADOS DO USUÁRIO (RESOLVE O ERRO 404) ---
export const obterDadosUsuario = async (req, res) => {
  try {
    const { whatsapp } = req.params;
    const whatsLimpo = String(whatsapp).replace(/\D/g, "");
    
    // Busca flexível para garantir que encontre o usuário
    const usuario = await Usuario.findOne({ WhatsApp: whatsLimpo }) || await Usuario.findOne({ whatsapp: whatsLimpo });
    
    if (!usuario) {
        // Em vez de 404, retornamos um objeto padrão para o Front-end não quebrar
        return res.status(200).json({
            nome: "Guerreiro(a)",
            peso: 0,
            altura: 0,
            idade: 25,
            meta: "Emagrecimento",
            pago: false,
            novo: true
        });
    }
    
    // Retorna os dados buscando tanto na raiz quanto no objeto dadosBiometricos (que vimos no seu MongoDB)
    return res.status(200).json({
        nome: usuario.nome || "Guerreiro",
        peso: usuario.peso || usuario.dadosBiometricos?.peso || 0,
        altura: usuario.altura || usuario.dadosBiometricos?.altura || 0,
        idade: usuario.idade || usuario.dadosBiometricos?.idade || 25,
        meta: usuario.meta || usuario.dadosBiometricos?.meta || "Emagrecimento",
        pago: usuario.pago || false
      });
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno ao buscar usuário" });
  }
};

// --- 4. HISTÓRICO (MANTIDO) ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: String(whatsapp).replace(/\D/g, "") });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar histórico" });
    }
};

// --- 5. ATIVAÇÃO VIP (MANTIDO) ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp } = req.body;
        await Usuario.findOneAndUpdate(
            { WhatsApp: String(whatsapp).replace(/\D/g, "") }, 
            { pago: true }
        );
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao ativar VIP" });
    }
    
};