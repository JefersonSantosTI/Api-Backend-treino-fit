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