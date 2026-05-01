import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    WhatsApp: { type: String, unique: true, required: true },
    nome: { type: String, default: "Guerreiro(a)" },
    pago: { type: Boolean, default: false },
    email: { type: String, default: "" },
    expiraEm: Date,
    meta: { type: String, default: "Emagrecimento" },
    
    // Campos na raiz (O que o seu App.js usa agora)
    peso: { type: Number, default: 0 },
    altura: { type: Number, default: 0 },
    idade: { type: Number, default: 25 }, // Padrão 25 para não zerar TMB
    genero: { type: String, default: "" },

    // Objeto de compatibilidade (Onde os dados do print estão salvos)
    dadosBiometricos: {
        peso: Number,
        altura: Number,
        idade: Number,
        meta: String
    },
    
    treinoCustomizado: { type: String, default: "" }, 
    treinoIA: { type: String, default: "" },
    planoEscolhido: String,
    historico: [
        {
            role: String,
            content: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

// MANTEREMOS 'usuários' para não perder os 10 documentos que você já tem
export default mongoose.model('Usuario', usuarioSchema, 'usuários');