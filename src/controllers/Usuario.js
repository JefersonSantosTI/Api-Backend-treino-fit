import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    WhatsApp: { type: String, unique: true, required: true },
    nome: String,
    pago: { type: Boolean, default: false },
    email: String,
    expiraEm: Date,
    // ADICIONE ESTA LINHA ABAIXO
    treinoCustomizado: { type: String, default: "" }, 
    dadosBiometricos: {
        peso: Number,
        altura: Number,
        idade: Number,
        genero: String
    },
    // ... resto do código igual
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