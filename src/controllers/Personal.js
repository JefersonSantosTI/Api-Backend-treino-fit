import mongoose from 'mongoose';

const PersonalSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  cref: { type: String, required: true, unique: true },
  googleId: { type: String, required: true },
  foto: { type: String },
  assinaturaAtiva: { type: Boolean, default: false }
}, { timestamps: true });

// Exportação padrão obrigatória
export default mongoose.model('Personal', PersonalSchema, 'personais');