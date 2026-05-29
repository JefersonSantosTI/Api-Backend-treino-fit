import mongoose from 'mongoose';

const ExercicioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  series: { type: Number, required: true },
  reps: { type: String, required: true },
  obs: { type: String }
});

// ✅ NOVO: Cada dia da semana terá sua própria lista de exercícios
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
  diaSemana: { type: String, required: true }
}, { timestamps: true });

const AlunoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  whatsapp: { type: String, required: true, unique: true },
  objetivo: { type: String, default: 'Emagrecimento' },
  statusTreino: { type: String, enum: ['Pendente', 'Rascunho IA', 'Enviado'], default: 'Pendente' },
  statusConta: { type: String, enum: ['Ativo', 'Off'], default: 'Ativo' },
  treinoSemanal: [RotinaDiariaSchema], // ✅ ALTERADO: Agora é um array mapeado por dias
  dietaPrescrita: [RefeicaoSchema],
  metaAgua: { type: String, default: 'Não calculada' },
  checkins: [CheckinSchema]
}, { timestamps: true });

export default mongoose.model('Aluno', AlunoSchema, 'alunos');