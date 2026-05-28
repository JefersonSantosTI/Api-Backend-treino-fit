import Personal from './Personal.js'; // FIX: Ajustado para o nome real com 'P' maiúsculo e mesma pasta
import Usuario from './Usuario.js';
import obterRespostaReceitas from '../services/openai.service.js';
import gerarDadosTreino from '../services/geradorTreinoIA.js';

// 1. AUTENTICAÇÃO / CADASTRO DO PERSONAL VIA GOOGLE
export const loginGooglePersonal = async (req, res) => {
    try {
        const { googleId, email, nome, foto, cref } = req.body;

        if (!googleId || !email) {
            return res.status(400).json({ erro: "Dados de autenticação inválidos." });
        }

        // Verifica se o Personal já está cadastrado
        let personal = await Personal.findOne({ email });

        if (!personal) {
            // Se for um novo cadastro, o CREF se torna obrigatório para validação de segurança
            if (!cref) {
                return res.status(202).json({ requerCref: true, mensagem: "Por favor, insira seu CREF para ativar a conta." });
            }
            
            personal = new Personal({ nome, email, googleId, foto, cref });
            await personal.save();
        }

        return res.status(200).json({ sucesso: true, perfil: personal });
    } catch (err) {
        console.error("❌ Erro login personal:", err.message);
        return res.status(500).json({ erro: "Falha na autenticação profissional." });
    }
};

// 2. LISTAR ALUNOS DO PORTAL DO PERSONAL
export const listarAlunosDoPersonal = async (req, res) => {
    try {
        const { personalId } = req.params;
        const alunos = await Usuario.find({ personalId }).select('-historico');
        return res.json(alunos);
    } catch (err) {
        return res.status(500).json({ erro: "Erro ao buscar lista de alunos." });
    }
};

// 3. FLUXO DE ONBOARDING DO ALUNO VIA LINK DE CONVITE DO PERSONAL
export const onboardingAlunoDoPersonal = async (req, res) => {
    try {
        const { whatsapp, nome, peso, altura, idade, meta, genero, personalId } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

        if (!whatsappLimpo || !personalId) {
            return res.status(400).json({ erro: "WhatsApp e identificação do Personal são obrigatórios." });
        }

        // 1. Prepara as variáveis de cálculo para a IA
        const dadosParaIA = { nome, peso: Number(peso), altura: Number(altura), idade: Number(idade), meta };

        // 2. Roda a IA de Treino e Alimentação de forma assíncrona/mastigada
        const treinoPromessa = gerarDadosTreino(meta, dadosParaIA);
        
        // Simulação estruturada para a IA de Receitas criar um rascunho de cardápio limpo
        const promptFake = [{ role: "user", content: `Monte uma sugestão inicial completa de plano alimentar focado em ${meta}.` }];
        const dietaPromessa = obterRespostaReceitas(promptFake, dadosParaIA);

        const [treinoData, dietaTexto] = await Promise.all([treinoPromessa, dietaPromessa]);

        // 3. Salva ou atualiza o Aluno já vinculado ao Personal correspondente
        const aluno = await Usuario.findOneAndUpdate(
            { WhatsApp: whatsappLimpo },
            {
                $set: {
                    nome,
                    peso: Number(peso),
                    altura: Number(altura),
                    idade: Number(idade),
                    meta,
                    genero,
                    tipoConta: "aluno",
                    personalId,
                    statusTreino: "rascunho_ia", // Fica como rascunho para o Personal validar
                    treinoCustomizado: JSON.stringify(treinoData),
                    dietaCustomizada: dietaTexto
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return res.status(200).json({ sucesso: true, mensagem: "Cadastro efetuado! Seus dados foram enviados para análise do seu Personal.", aluno });
    } catch (err) {
        console.error("❌ Erro no onboarding do aluno:", err.message);
        return res.status(500).json({ erro: "Falha ao processar cadastro do aluno." });
    }
};

// 4. PERSONAL REVISA, EDITA E ENVIA DEFINITIVAMENTE PARA O ALUNO
export const aprovarTreinoEDietaDoPersonal = async (req, res) => {
    try {
        const { alunoId, treinoEditado, dietaEditada } = req.body;

        const alunoAtualizado = await Usuario.findByIdAndUpdate(
            alunoId,
            {
                $set: {
                    treinoCustomizado: typeof treinoEditado === 'string' ? treinoEditado : JSON.stringify(treinoEditado),
                    dietaCustomizada: dietaEditada,
                    statusTreino: "enviado_personal" // Altera o status para o aluno poder visualizar
                }
            },
            { returnDocument: 'after' }
        );

        return res.json({ sucesso: true, mensagem: "Plano atualizado e enviado com sucesso ao aluno!", aluno: alunoAtualizado });
    } catch (err) {
        return res.status(500).json({ erro: "Erro ao salvar alterações do Personal." });
    }
};