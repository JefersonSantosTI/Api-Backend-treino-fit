import Usuario from "../controllers/Usuario.js"
import obterRespostaReceitas from "../services/openai.service.js";
import gerarDadosTreino from "../services/geradorTreinoIA.js"; 

// --- 1. CHAT DE RECEITAS ---
// --- 1. CHAT DE RECEITAS ---
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

        // 🔥 EXTRAINDO O PACOTE COMPLETO DO QUIZ 🔥
        const NOME_FINAL = perfilExtraido?.nome || user.nome || "Guerreiro(a)";
        const PESO_FINAL = Number(perfilExtraido?.peso || user.peso || user.dadosBiometricos?.peso || 75);
        const ALTURA_FINAL = Number(perfilExtraido?.altura || user.altura || user.dadosBiometricos?.altura || 1.75);
        const META_FINAL = perfilExtraido?.meta || user.meta || user.dadosBiometricos?.meta || "Emagrecimento";
        const IDADE_FINAL = Number(perfilExtraido?.idade || user.idade || user.dadosBiometricos?.idade || 25);
        const GENERO_FINAL = perfilExtraido?.genero || user.genero || "Masculino";
        const NIVEL_FINAL = perfilExtraido?.nivel || user.nivel || "Intermediário";
        const DIAS_FINAL = perfilExtraido?.diasTreino || user.diasTreino || "5";
        const RESTRICOES_FINAL = perfilExtraido?.restricoes || user.restricoes || "Nenhuma";
        const LESOES_FINAL = perfilExtraido?.lesoes || user.lesoes || "Nenhuma";

        const mensagensParaEnviar = (user.historico || []).slice(-6).map(h => ({
            role: h.role || "user",
            content: h.content || ""
        }));

        mensagensParaEnviar.push({ role: "user", content: mensagemAtual });

        // 🔥 ENVIANDO TUDO PARA A INTELIGÊNCIA ARTIFICIAL 🔥
        const respostaIA = await obterRespostaReceitas(mensagensParaEnviar, {
            nome: NOME_FINAL, 
            peso: PESO_FINAL, 
            altura: ALTURA_FINAL, 
            meta: META_FINAL,
            idade: IDADE_FINAL,
            genero: GENERO_FINAL,
            nivel: NIVEL_FINAL,
            diasTreino: DIAS_FINAL,
            restricoes: RESTRICOES_FINAL, // O "Pão com Ovo" vai passar por aqui!
            lesoes: LESOES_FINAL
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

// --- 3. DADOS DO USUÁRIO ---
export const obterDadosUsuario = async (req, res) => {
  try {
    const { whatsapp } = req.params;
    const whatsLimpo = String(whatsapp).replace(/\D/g, "");
    
    const usuario = await Usuario.findOne({ WhatsApp: whatsLimpo }) || await Usuario.findOne({ whatsapp: whatsLimpo });
    
    if (!usuario) {
        return res.status(200).json({
            nome: "Guerreiro(a)", peso: 0, altura: 0, idade: 25, meta: "Emagrecimento", pago: false, novo: true
        });
    }
    
    return res.status(200).json({
        nome: usuario.nome || "Guerreiro",
        peso: usuario.peso || usuario.dadosBiometricos?.peso || 0,
        altura: usuario.altura || usuario.dadosBiometricos?.altura || 0,
        idade: usuario.idade || usuario.dadosBiometricos?.idade || 25,
        meta: usuario.meta || usuario.dadosBiometricos?.meta || "Emagrecimento",
        pago: usuario.pago || false
      });
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno" });
  }
};

// --- 4. ATUALIZAR ONBOARDING ---
export const atualizarDadosOnboarding = async (req, res) => {
    try {
        const { whatsapp, nome, peso, altura, meta, idade } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        const usuario = await Usuario.findOneAndUpdate(
            { WhatsApp: whatsappLimpo },
            { 
                $set: { 
                    nome, 
                    peso: Number(peso), 
                    altura: Number(altura), 
                    idade: Number(idade), 
                    meta,
                    WhatsApp: whatsappLimpo
                } 
            },
            { upsert: true, returnDocument: 'after' } // Corrigido para evitar o aviso do Mongoose
        );
        res.status(200).json({ mensagem: "Sucesso", usuario });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao salvar" });
    }
};

// --- 5. HISTÓRICO ---
export const obterHistorico = async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const user = await Usuario.findOne({ WhatsApp: String(whatsapp).replace(/\D/g, "") });
        res.json(user ? user.historico : []);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar" });
    }
};

// --- 6. ATIVAÇÃO VIP MANUAL ---
export const tornarVip = async (req, res) => {
    try {
        const { whatsapp, codigo } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        if (codigo === "LIBERAR2026") {
            await Usuario.findOneAndUpdate({ WhatsApp: whatsappLimpo }, { pago: true }, { returnDocument: 'after' });
            return res.json({ sucesso: true, mensagem: "💎 VIP Ativado!" });
        }
        res.status(401).json({ erro: "Código inválido" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao ativar VIP" });
    }
};

// --- 7. WEBHOOK KIWIFY (FINALIZADO PARA WHATSAPP) ---
// --- 7. WEBHOOK KIWIFY (AJUSTADO PARA FORMATO DE WHATSAPP BR) ---
// --- 7. WEBHOOK KIWIFY (VERSÃO BLINDADA) ---
export const webhookKiwify = async (req, res) => {
    try {
        const { order_status, customer, Customer, status: statusRaiz } = req.body;
        const cliente = customer || Customer;
        const status = order_status || statusRaiz;

        if (status === 'paid' || status === 'approved') {
            const emailCliente = cliente.email;
            // Kiwify pode enviar mobile ou phone, pegamos o que existir
            const whatsappBruto = cliente.mobile || cliente.phone || "";
            
            // Limpa tudo (deixa só números)
            const whatsappCompleto = whatsappBruto.replace(/\D/g, ""); 
            // Remove o 55 se existir (para garantir que o DDD está puro)
            const whatsappSem55 = whatsappCompleto.startsWith("55") ? whatsappCompleto.slice(2) : whatsappCompleto;

            console.log(`📡 Processando Pagamento: WhatsApp(${whatsappCompleto}) | Email(${emailCliente})`);

            // Busca buscando pelo WhatsApp (preferencial) ou Email
            const usuario = await Usuario.findOneAndUpdate(
                { 
                    $or: [
                        { WhatsApp: whatsappCompleto }, 
                        { WhatsApp: whatsappSem55 }, // Caso esteja sem o 55
                        { email: emailCliente }       // Caso o aluno tenha e-mail
                    ] 
                },
                { 
                    $set: { 
                        pago: true,
                        nome: cliente.full_name || cliente.name || "Guerreiro(a)",
                        dataPagamento: new Date(),
                        expiraEm: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
                    } 
                },
                { returnDocument: 'after' }
            );

            if (usuario) {
                console.log(`✅ VIP liberado com sucesso para: ${usuario.nome} (${usuario.WhatsApp})`);
                
                try {
                    const io = req.app.get("io");
                    // O identificador precisa ser o mesmo que o front-end usou no socket.join()
                    const identificador = usuario.email || usuario.WhatsApp; 
                    io.to(identificador).emit("pagamento_aprovado", {
                        status: "sucesso",
                        tipo: "aluno"
                    });
                    console.log(`📡 Evento emitido para aluno via Socket: ${identificador}`);
                } catch (err) {
                    console.error("Erro ao disparar Socket:", err);
                }
                
                return res.status(200).json({ status: "sucesso" });
            }


            
            
            console.warn(`⚠️ Usuário não encontrado no banco. 
                Tentativas de busca: 
                WhatsApp:${whatsappCompleto}, 
                WhatsAppSem55:${whatsappSem55}, 
                Email:${emailCliente}`);
        }
        
        return res.status(200).send("OK - Evento ignorado ou não é pagamento");
    } catch (err) {
        console.error("❌ Erro Crítico no Webhook:", err.message);
        return res.status(500).send("Erro interno");
    }
};