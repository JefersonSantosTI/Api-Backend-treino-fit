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
  }
}, { timestamps: true });

const AlunoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  whatsapp: { type: String, required: true, unique: true },
  objetivo: { type: String, default: 'Emagrecimento' },
  statusTreino: { type: String, enum: ['Pendente', 'Rascunho IA', 'Enviado'], default: 'Pendente' },
  statusConta: { type: String, enum: ['Ativo', 'Off'], default: 'Ativo' },
  
  // ✅ ADICIONADO: Objeto para guardar as medidas do Personal
  medidas: {
    braco: { type: String, default: "" },
    perna: { type: String, default: "" },
    gluteo: { type: String, default: "" },
    torax: { type: String, default: "" },
    cintura: { type: String, default: "" }
  },

  treinoSemanal: [RotinaDiariaSchema],
  dietaPrescrita: [RefeicaoSchema],
  metaAgua: { type: String, default: 'Não calculada' },
  checkins: [CheckinSchema]
}, { timestamps: true });

export default mongoose.model('Aluno', AlunoSchema, 'alunos');