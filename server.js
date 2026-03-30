import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
// Certifique-se que o nome do arquivo na pasta src/routes é exatamente esse:
import receitasRoutes from "./src/routes/receitas.route.js"; 

const app = express();

// --- CONFIGURAÇÕES DE MIDDLEWARE ---
app.use(cors()); // Permite que o Front-end acesse a API
app.use(express.json()); // Permite que o servidor entenda JSON (essencial para o VIP e Chat)

// --- CONEXÃO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado com sucesso!"))
  .catch(err => console.error("❌ Erro ao conectar MongoDB:", err));

// --- DEFINIÇÃO DAS ROTAS ---
// Mudamos para "/api/receitas" para bater com o API_URL do seu App.js
app.use("/api/receitas", receitasRoutes);

// Rota raiz para teste rápido no navegador
app.get("/", (req, res) => {
  res.send("API TreinoFit rodando 🚀 (Acesse /api/receitas para os dados)");
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
  console.log(`🔗 Endpoint VIP: http://localhost:${PORT}/api/receitas/tornar-vip`);
});