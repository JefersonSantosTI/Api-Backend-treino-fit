import mongoose from 'mongoose';

const ExercicioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  series: { type: Number, required: true },
  reps: { type: String, required: true },
  obs: { type: String }
});

const CheckinSchema = new mongoose.Schema({
  data: { type: String, required: true },         // Ex: "28/05"
  diaSemana: { type: String, required: true }    // Ex: "Quinta-feira"
}, { timestamps: true });

const AlunoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  whatsapp: { type: String, required: true, unique: true },
  objetivo: { type: String, default: 'Emagrecimento' },
  statusTreino: { type: String, enum: ['Pendente', 'Rascunho IA', 'Enviado'], default: 'Pendente' },
  statusConta: { type: String, enum: ['Ativo', 'Off'], default: 'Ativo' },
  treinoPrescrito: [ExercicioSchema],
  checkins: [CheckinSchema]
}, { timestamps: true });

export default mongoose.model('Aluno', AlunoSchema);