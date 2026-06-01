const PersonalSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  // O Mongoose vai buscar o campo "e-mail" no banco, mas usar como "email" no código
  email: { 
    type: String, 
    required: true, 
    unique: true,
    map: 'e-mail' 
  },
  cref: { type: String, required: true, unique: true },
  googleId: { type: String, required: true },
  foto: { type: String },
  assinaturaAtiva: { type: Boolean, default: false }
}, { timestamps: true });