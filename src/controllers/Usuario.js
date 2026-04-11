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
            role: String,
            content: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

export default mongoose.model('Usuario', usuarioSchema, 'usuários'); 
// O terceiro parâmetro força o Mongoose a usar o nome exato da sua coleção no Atlas