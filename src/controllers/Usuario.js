import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    // Identificador único
    WhatsApp: { type: String, unique: true, required: true },
    
    // Dados de Perfil (Soltos na raiz para facilitar a busca do App.js)
    nome: { type: String, default: "Guerreiro(a)" },
    pago: { type: Boolean, default: false },
    email: { type: String, default: "" },
    expiraEm: Date,
    meta: { type: String, default: "Emagrecimento" },
    
    // Biometria (Campos diretos)
    peso: { type: Number, default: 0 },
    altura: { type: Number, default: 0 },
    idade: { type: Number, default: 0 },
    genero: { type: String, default: "" },
    
    // Treinos e IA
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

// Exporta o modelo garantindo o uso da coleção 'usuários' com acento
export default mongoose.model('Usuario', usuarioSchema, 'usuários');