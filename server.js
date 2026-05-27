import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import receitasRoutes from "./src/routes/receitas.route.js"; 

const app = express();

// --- CONFIGURAÇÃO DO CORS (PROTEÇÃO DA API) ---
const allowedOrigins = [
  "https://treinofit.app.br",
  "https://www.treinofit.app.br",
  "https://front-end-api-nv55.onrender.com" // Mantém o do render por segurança temporária
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (como a Kiwify enviando o webhook por trás do pano, ou testes no Postman/Insomnia)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "A política CORS deste servidor não permite acesso a partir da origem especificada.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json()); 

// --- CONEXÃO BANCO DE DADOS ---
// Importante: Verifique se sua URI do Atlas já aponta para 'nutricionista_db'
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado com sucesso!"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// --- ROTAS ---
// O prefixo /api já engloba tudo (receitas, usuários, webhook)
app.use("/api", receitasRoutes);

app.get("/", (req, res) => {
  res.send("API TreinoFit - Online e Sincronizada");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});