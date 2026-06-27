import mongoose from 'mongoose';

const ExercicioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  series: { type: Number, required: true },
  reps: { type: String, required: true },
  obs: { type: String }
});

const RotinaDiariaSchema = new mongoose.Schema({
  dia: { type: String, enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'], required: true },
  exercicios: [ExercicioSchema]
});

const RefeicaoSchema = new mongoose.Schema({
  refeicao: { type: String, required: true },
  itens: { type: String, required: true }
});

const CheckinSchema = new mongoose.Schema({
  data: { type: String, required: true },
  diaSemana: { type: String, required: true },
  feedback: {
    intensidade: String,
    carga: String,
    comentario: String
  },
  respostaPersonal: { type: String, default: "" }
}, { timestamps: true });

const AlunoSchema = new mongoose.Schema({
  personalId: { type: String, required: true }, 

  nome: { type: String, required: true },
  whatsapp: { type: String, required: true, unique: true },
  objetivo: { type: String, default: 'Emagrecimento' },
  statusTreino: { type: String, enum: ['Pendente', 'Rascunho IA', 'Enviado'], default: 'Pendente' },
  statusConta: { type: String, enum: ['Ativo', 'Off'], default: 'Ativo' },
  
  peso: { type: Number },
  altura: { type: Number },
  idade: { type: Number },
  genero: { type: String, default: 'Masculino' },
  nivel: { type: String, default: 'Intermediário' },
  diasTreino: { type: String, default: '5' },
  restricoes: { type: String, default: '' },
  lesoes: { type: String, default: '' },

  medidas: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },

  treinoSemanal: [RotinaDiariaSchema],
  dietaPrescrita: [RefeicaoSchema],
  
  metaAgua: { type: String, default: 'Não calculada' },
  
  // ✅ ATUALIZADO: Com o novo campo tipoFrequencia
  lembreteAgua: {
    ativo: { type: Boolean, default: false },
    horaInicio: { type: Number, default: 8 },
    horaFim: { type: Number, default: 22 },
    intervaloHoras: { type: Number, default: 2 },
    tipoFrequencia: { type: String, enum: ['Diário', 'Mensal', 'Definitivo'], default: 'Definitivo' },
    pushSubscription: { type: mongoose.Schema.Types.Mixed, default: null } 
  },

  checkins: [CheckinSchema]
}, { timestamps: true });

// Adicione esta função nova:
const salvarCargaNoBanco = async (alunoId, exercicioNome, carga, esforco) => {
  // Usa o seu model (Aluno) para injetar a carga no histórico
  const alunoAtualizado = await Aluno.findByIdAndUpdate(
      alunoId, 
      {
          $push: { 
              historicoCargas: {
                  data: new Date(),
                  exercicio: exercicioNome,
                  carga: carga,
                  esforco: esforco
              }
          }
      },
      { new: true } 
  );

  if (!alunoAtualizado) {
      throw new Error("Aluno não encontrado no banco de dados.");
  }
  return alunoAtualizado;
};

// ATENÇÃO: Não se esqueça de adicionar o nome dela no seu module.exports lá no final do arquivo!
// Exemplo: module.exports = { funcaoAntiga1, funcaoAntiga2, salvarCargaNoBanco };

export default mongoose.model('Aluno', AlunoSchema, 'alunos');