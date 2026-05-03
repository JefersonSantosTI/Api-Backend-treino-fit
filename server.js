import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import receitasRoutes from "./src/routes/receitas.route.js"; 

const app = express();

app.use(cors()); 
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