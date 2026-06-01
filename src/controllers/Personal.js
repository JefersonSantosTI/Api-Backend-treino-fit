import mongoose from 'mongoose';

const PersonalSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // O E-mail do Google (único)
  cref: { type: String, required: true, unique: true },  // A licença de trabalho
  googleId: { type: String, required: true },            // O ID de segurança do Google
  foto: { type: String },                                // A foto de perfil do Google
  // ✅ CAMPO OBRIGATÓRIO PARA A INTEGRAÇÃO COM KIWIFY
  assinaturaAtiva: { type: Boolean, default: false }     // Controla o acesso ao sistema
}, { timestamps: true });

export default mongoose.model('Personal', PersonalSchema, 'personais');