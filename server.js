import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import receitasRoutes from "./src/routes/receitas.route.js"; 
import alunoRoutes from "./src/routes/aluno.routes.js"; 
import personalRoutes from "./src/routes/personal.routes.js";

// ✅ ADICIONADO: Importando o serviço de Cron Job para ativar os lembretes automáticos!
// Obs: Ajuste o caminho "./src/services/lembreteAgua.service.js" conforme a pasta real onde você salvou o arquivo
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

// --- ROTAS ---
app.use("/api", receitasRoutes);
app.use("/api", alunoRoutes); 
app.use("/api", personalRoutes);

app.get("/", (req, res) => {
  res.send("API TreinoFit - Online e Sincronizada");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});