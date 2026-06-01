import Personal from '../controllers/Personal.js'; 

export const autenticarPersonal = async (req, res) => {
  try {
    const { nome, email, cref, googleId, foto } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ mensagem: 'Falha de segurança. Dados do Google ausentes.' });
    }

    let personal = await Personal.findOne({ email });

    if (!personal) {
      if (!cref) {
        return res.status(200).json({ requerCref: true, mensagem: 'Primeiro acesso identificado. Informe o CREF.' });
      }

      // ✅ BLINDAGEM DE PADRÃO (REGEX): Exige formato oficial do CREF
      // Aceita de 4 a 6 números, traço, letra G ou P, barra, e 2 letras do Estado
      const regexCref = /^\d{4,6}-[GgPp]\/[A-Za-z]{2}$/;
      if (!regexCref.test(cref.trim())) {
        return res.status(400).json({ mensagem: 'CREF Inválido! Use o formato oficial. Ex: 123456-G/SP' });
      }
      
      const crefEmUso = await Personal.findOne({ cref });
      if (crefEmUso) {
        return res.status(400).json({ mensagem: 'Este CREF já está vinculado a outra conta Google.' });
      }

      personal = new Personal({ nome, email, cref: cref.trim().toUpperCase(), googleId, foto });
      await personal.save();
    }

    res.status(200).json(personal);

  } catch (error) {
    res.status(500).json({ mensagem: 'Erro na autenticação.', erro: error.message });
  }
};

export const loginGooglePersonal = async (req, res) => {
  res.status(200).json({ mensagem: "Use a nova rota /api/personal/auth" });
};

export const listarAlunosDoPersonal = async (req, res) => {
  // Retorna uma lista vazia temporariamente para o front-end não quebrar
  res.status(200).json([]); 
};

export const onboardingAlunoDoPersonal = async (req, res) => {
  res.status(200).json({ mensagem: "Em desenvolvimento" });
};

export const aprovarTreinoEDietaDoPersonal = async (req, res) => {
  res.status(200).json({ mensagem: "Em desenvolvimento" });
};

// =========================================================
// ✅ INTEGRAÇÃO KIWIFY: RECEBE E PROCESSA O PAGAMENTO
// =========================================================
export const processarWebhookKiwify = async (req, res) => {
  console.log("🔥 Webhook recebido! Dados:", JSON.stringify(req.body)); // ✅ ADICIONE ISSO
  try {
    const evento = req.body;
    // O Kiwify envia os dados do cliente dentro de 'Customer' e o status em 'order_status'
    const emailComprador = evento?.Customer?.email;
    const statusCompra = evento?.order_status;

    // Se o webhook não trouxer email, apenas ignoramos para não dar erro
    if (!emailComprador) {
      return res.status(400).send("Webhook recebido, mas sem email do comprador.");
    }

    // 1. Procura o Personal pelo e-mail que ele usou na compra da Kiwify
    const personal = await Personal.findOne({ email: emailComprador });

    if (!personal) {
      console.log(`[KIWIFY] Compra aprovada para ${emailComprador}, mas não achou conta no banco. Aguardando ele fazer o login.`);
      return res.status(200).send("Conta não encontrada. Webhook recebido.");
    }

    // 2. Liberta ou Bloqueia o acesso dependendo da ação no cartão
    if (statusCompra === 'paid') {
      personal.assinaturaAtiva = true;
      console.log(`[KIWIFY] 💰 Acesso LIBERADO para o Personal: ${emailComprador}`);
    } else if (statusCompra === 'refunded' || statusCompra === 'canceled' || statusCompra === 'chargeback') {
      personal.assinaturaAtiva = false;
      console.log(`[KIWIFY] 🚫 Acesso BLOQUEADO para o Personal: ${emailComprador}`);
    }

    // 3. Salva a nova configuração no banco de dados
    await personal.save();
    
    // O Kiwify precisa de uma resposta 200 OK para saber que o seu servidor recebeu o aviso
    res.status(200).send("Webhook processado com sucesso e acesso atualizado!");

  } catch (error) {
    console.error("Erro Crítico no Webhook da Kiwify:", error);
    res.status(500).send("Erro interno ao processar webhook.");
  }
};