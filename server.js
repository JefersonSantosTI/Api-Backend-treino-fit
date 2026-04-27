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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado!"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// --- ROTA 1: WEBHOOK KIWIFY (VERSÃO ORIGINAL) ---
app.post("/webhook-kiwify", async (req, res) => {
    try {
        const data = req.body;
        console.log("📦 Dados recebidos do Kiwify!");
        const cliente = data.Customer || data.customer;
        const statusAtual = data.order_status || data.status;

        if ((statusAtual === "paid" || statusAtual === "approved") && cliente) {
            const mobileRaw = cliente.mobile;
            if (mobileRaw) {
                const whatsappCliente = mobileRaw.replace(/\D/g, "");
                const dataExpiracao = new Date();
                dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

                await mongoose.connection.collection('usuários').updateOne(
                    { WhatsApp: whatsappCliente }, 
                    { 
                        $set: { 
                            pago: true, 
                            expiraEm: dataExpiracao,
                            email: cliente.email || "",
                            nome: cliente.full_name || cliente.name || "Guerreiro",
                            dataPagamento: new Date()
                        } 
                    },
                    { upsert: true }
                );
                console.log(`✅ VIP Ativado: ${whatsappCliente}`);
            }
        }
        res.status(200).send("OK");
    } catch (err) {
        console.error("❌ Erro Webhook:", err.message);
        res.status(200).send("Erro Interno");
    }
});

// --- ROTA 2: VALIDAR CÓDIGO MANUAL ---
app.post("/api/usuarios/ativar-vip", async (req, res) => {
    const { whatsapp, codigo } = req.body;
    const whatsappLimpo = String(whatsapp).replace(/\D/g, "");
    try {
        const usuario = await mongoose.connection.collection('usuários').findOne({ WhatsApp: whatsappLimpo });
        if (!usuario) return res.status(404).json({ mensagem: "Usuário não encontrado." });

        if (codigo === "LIBERAR2026" || codigo === usuario.codigoVip) {
            await mongoose.connection.collection('usuários').updateOne(
                { WhatsApp: whatsappLimpo },
                { $set: { pago: true } }
            );
            return res.json({ mensagem: "💎 VIP Ativado com sucesso!" });
        } else {
            return res.status(401).json({ mensagem: "Código inválido." });
        }
    } catch (err) {
        res.status(500).json({ mensagem: "Erro ao validar código." });
    }
});

// --- ROTA 3: ONBOARDING (PESO/ALTURA) ---
app.post("/api/usuarios/atualizar", async (req, res) => {
    try {
        const { whatsapp, nome, peso, altura, meta } = req.body;
        const whatsappLimpo = String(whatsapp).replace(/\D/g, "");
        // Mantendo o uso do .useDb conforme seu código original
        const db = mongoose.connection.useDb('nutricionista_db');

        await db.collection('usuários').updateOne(
            { WhatsApp: whatsappLimpo },
            { 
                $set: { 
                    nome: nome,
                    peso: Number(peso), 
                    altura: Number(altura), 
                    meta: meta,
                    WhatsApp: whatsappLimpo
                } 
            },
            { upsert: true }
        );
        res.status(200).json({ mensagem: "Sucesso" });
    } catch (err) {
        console.error("Erro ao salvar:", err);
        res.status(500).json({ erro: "Erro ao salvar" });
    }
});

// --- ROTA PARA O FRONTEND BUSCAR DADOS (ESSENCIAL) ---
app.get("/api/usuarios/:whatsapp", async (req, res) => {
    try {
        const whatsappLimpo = req.params.whatsapp.replace(/\D/g, "");
        const db = mongoose.connection.useDb('nutricionista_db');
        const usuario = await db.collection('usuários').findOne({ WhatsApp: whatsappLimpo });
        if (usuario) {
            res.json(usuario);
        } else {
            res.status(404).json({ erro: "Não encontrado" });
        }
    } catch (e) {
        res.status(500).json({ erro: "Erro interno" });
    }
});

// Rotas do Chat/Receitas
app.use("/api", receitasRoutes);

app.get("/", (req, res) => {
  res.send("API TreinoFit - Online");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});