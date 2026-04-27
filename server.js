import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Usuario from "./src/models/usuario.js"; // IMPORTANTE: Importe o modelo atualizado
import receitasRoutes from "./src/routes/receitas.route.js"; 

const app = express();
app.use(cors()); 
app.use(express.json()); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado!"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// --- ROTA DE BUSCA (Sincronizar Dados do Home) ---
// Resolve o problema de não aparecer peso/altura no início
app.get("/api/usuarios/:whatsapp", async (req, res) => {
    try {
        const { whatsapp } = req.params;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");
        
        // Busca o usuário no banco correto
        const db = mongoose.connection.useDb('nutricionista_db');
        const usuario = await db.collection('usuários').findOne({ WhatsApp: whatsappLimpo });

        if (usuario) {
            res.status(200).json(usuario);
        } else {
            res.status(404).json({ mensagem: "Usuário não cadastrado" });
        }
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar dados" });
    }
});

// --- ROTA DE ATUALIZAÇÃO (Onboarding) ---
// Resolve o erro 404 ao salvar nome/peso/altura
app.post("/api/usuarios/atualizar", async (req, res) => {
    try {
        const { whatsapp, nome, peso, altura, meta } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");
        const db = mongoose.connection.useDb('nutricionista_db');

        await db.collection('usuários').updateOne(
            { WhatsApp: whatsappLimpo },
            { 
                $set: { 
                    nome,
                    peso: Number(peso), 
                    altura: Number(altura), 
                    meta,
                    WhatsApp: whatsappLimpo
                } 
            },
            { upsert: true }
        );

        res.status(200).json({ mensagem: "Sucesso" });
    } catch (err) {
        console.error("Erro ao salvar perfil:", err);
        res.status(500).json({ erro: "Erro ao salvar" });
    }
});

// --- ROTA DO KIWIFY ---
app.post("/webhook-kiwify", async (req, res) => {
    // ... seu código do webhook (pode manter como está)
});

// --- OUTRAS ROTAS ---
app.use("/api", receitasRoutes); // Mantido abaixo para não dar conflito

app.get("/", (req, res) => {
  res.send("API TreinoFit - Online e Sincronizada");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});