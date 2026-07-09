import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    WhatsApp: { type: String, unique: true, required: true },
    nome: { type: String, default: "Guerreiro(a)" },
    pago: { type: Boolean, default: false },
    email: { type: String, default: "" },
    expiraEm: Date,
    meta: { type: String, default: "Emagrecimento" },
    
    // --- NOVO: CAMPOS PARA SISTEMA MULTI-ABAS (ESTILO MFIT) ---
    tipoConta: { type: String, enum: ["comum", "aluno"], default: "comum" },
    personalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personal', default: null },
    statusTreino: { type: String, enum: ["nenhum", "rascunho_ia", "enviado_personal"], default: "nenhum" },
    dietaCustomizada: { type: String, default: "" }, 

    // Campos na raiz
    peso: { type: Number, default: 0 },
    altura: { type: Number, default: 0 },
    idade: { type: Number, default: 25 },
    genero: { type: String, default: "Masculino" },

    // 🔥 AS GAVETAS QUE FALTAVAM PARA A IA LER 🔥
    nivel: { type: String, default: "Intermediário" },
    diasTreino: { type: String, default: "5" },
    restricoes: { type: String, default: "" },
    lesoes: { type: String, default: "" },

    // Objeto de compatibilidade
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

export default mongoose.model('Usuario', usuarioSchema, 'usuários');