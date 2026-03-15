import express from "express";
import receitasRoutes from "./src/routes/receitas.route.js";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar MongoDB
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