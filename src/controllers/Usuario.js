
import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
    whatsapp: { type: String, unique: true, required: true },
    nome: String,
    dadosBiometricos: {
        peso: Number,
        altura: Number,
        idade: Number,
        genero: String
    },
    planoEscolhido: String,
    pago: { type: Boolean, default: false },
    historico: [
        {
            role: String, // 'user' ou 'assistant'
            content: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

export default mongoose.model('Usuario', UsuarioSchema);