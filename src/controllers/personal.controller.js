// ❌ ALTERADO: Mudamos de '../controllers/Personal.js' para o caminho do seu MODELO
import Personal from '../controllers/Personal.js'; 

export const autenticarPersonal = async (req, res) => {
  try {
    const { nome, email, cref, googleId, foto } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ mensagem: 'Falha de segurança. Dados do Google ausentes.' });
    }

    // 1. Procura se este email já está cadastrado no sistema
    let personal = await Personal.findOne({ email });

    // 2. É O PRIMEIRO ACESSO DA PESSOA!
    if (!personal) {
      if (!cref) {
        return res.status(200).json({ requerCref: true, mensagem: 'Primeiro acesso identificado. Informe o CREF.' });
      }
      
      const crefEmUso = await Personal.findOne({ cref });
      if (crefEmUso) {
        return res.status(400).json({ mensagem: 'Este CREF já está vinculado a outra conta Google.' });
      }

      // Se passou em tudo, cria a conta oficial do Personal
      personal = new Personal({ nome, email, cref, googleId, foto });
      await personal.save();
    }

    // 3. Devolve os dados para o Front-end autorizar a entrada
    res.status(200).json(personal);

  } catch (error) {
    res.status(500).json({ mensagem: 'Erro na autenticação.', erro: error.message });
  }
};