import dotenv from "dotenv";
dotenv.config(); // Carrega o .env antes de importar os outros arquivos

import express from "express";
import receitasRoutes from "./src/routes/receitas.route.js";
import cors from "cors";
import mongoose from "mongoose";
// ... restante do código



const app = express();
const PORT = process.env.PORT || 3000;

// Conectar MongoDB
// No seu server.js, altere para:
mongoose.connect(process.env.MONGO_URI) 
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

app.use(cors());
app.use(express.json());

app.use("/receitas", receitasRoutes);

app.get("/", (req, res) => {
  res.send("API TreinoFit rodando 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
