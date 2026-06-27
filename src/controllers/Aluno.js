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

// ✅ O SCHEMA PRINCIPAL CORRETO E UNIFICADO
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
  
  lembreteAgua: {
    ativo: { type: Boolean, default: false },
    horaInicio: { type: Number, default: 8 },
    horaFim: { type: Number, default: 22 },
    intervaloHoras: { type: Number, default: 2 },
    tipoFrequencia: { type: String, enum: ['Diário', 'Mensal', 'Definitivo'], default: 'Definitivo' },
    pushSubscription: { type: mongoose.Schema.Types.Mixed, default: null } 
  },

  checkins: [CheckinSchema],

  // 👉 A NOSSA GAVETA NOVA COLOCADA NO LUGAR CERTO:
  historicoCargas: [{
      data: Date,
      exercicio: String,
      carga: Number,
      esforco: String
  }]

}, { timestamps: true });

export default mongoose.model('Aluno', AlunoSchema, 'alunos');