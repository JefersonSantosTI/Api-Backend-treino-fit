import mongoose from 'mongoose';

const personalSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    googleId: { type: String, required: true }, // Armazena o ID único do Google Auth
    foto: { type: String, default: "" },
    cref: { type: String, required: true }, // Registro profissional obrigatório
    tipoConta: { type: String, default: "personal" },
    ativo: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Personal', personalSchema, 'personais');