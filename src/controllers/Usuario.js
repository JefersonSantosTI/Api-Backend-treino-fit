import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    // Ajustado para 'WhatsApp' com W maiúsculo para bater com seu print do MongoDB
    WhatsApp: { type: String, unique: true, required: true },
    nome: String,
    pago: { type: Boolean, default: false },
    email: String,
    expiraEm: Date,
    dadosBiometricos: {
        peso: Number,
        altura: Number,
        idade: Number,
        genero: String
    },
    planoEscolhido: String,
    historico: [
        {
            role: String,
            content: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

// O terceiro parâmetro 'usuários' garante que o Mongoose use a coleção com acento
export default mongoose.model('Usuario', usuarioSchema, 'usuários');