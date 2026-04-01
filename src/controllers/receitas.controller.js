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
        
        // ... (Lógica da instrucaoSeguranca e historicoParaIA permanece igual)

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
                peso: String(user.peso), 
                altura: String(user.altura) 
            }
        });

    } catch (err) {
        console.error("ERRO NO CONTROLLER:", err);
        res.status(500).json({ erro: "Erro interno" });
    }
};