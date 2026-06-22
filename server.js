import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// --- IMPORTAÇÃO DAS ROTAS ANTIGAS ---
import receitasRoutes from "./src/routes/receitas.route.js"; 
import alunoRoutes from "./src/routes/aluno.routes.js"; 
import personalRoutes from "./src/routes/personal.routes.js";

// ✅ NOVA ROTA ADICIONADA: Landing Page / Home do App
import landingRoutes from "./src/routes/landingRoutes.js"; 

// ✅ ADICIONADO: Serviço de Cron Job (Lembretes)
import "./src/services/lembreteAgua.service.js"; 

const app = express();

// --- CONFIGURAÇÃO DO CORS (PROTEÇÃO DA API) ---
const allowedOrigins = [
  "https://treinofit.app.br",
  "https://www.treinofit.app.br",
  "https://front-end-api-nv55.onrender.com", 
  "http://localhost:5173", 
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado com sucesso!"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// --- 🚀 NOVAS ROTAS DA SUA PÁGINA DE APRESENTAÇÃO ---
// Substitui a rota antiga de "/" para carregar o seu novo visual lindo!
app.use("/", landingRoutes);

// --- ROTAS DA API ---
app.use("/api", receitasRoutes);
app.use("/api", alunoRoutes); 
app.use("/api", personalRoutes);

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});