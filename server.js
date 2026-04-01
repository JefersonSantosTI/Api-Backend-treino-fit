import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import receitasRoutes from "./src/routes/receitas.route.js"; 

const app = express();

// Middlewares (Sempre antes das rotas)
app.use(cors()); 
app.use(express.json()); 

// Conexão Banco de Dados
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado!"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// ROTAS
// Usamos o prefixo "/api" para que as rotas internas 
// (como /receitas/perguntar) se encaixem perfeitamente.
app.use("/api", receitasRoutes);

// Rota de Teste Direto no Navegador
app.get("/", (req, res) => {
  res.send("API TreinoFit rodando 🚀");
});

const PORT = process.env.PORT || 10000; // Render usa porta 10000 por padrão
app.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});