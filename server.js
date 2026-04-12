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

// --- ROTA 1: WEBHOOK KIWIFY (ATIVAÇÃO AUTOMÁTICA) ---

app.post("/webhook-kiwify", async (req, res) => {
    try {
        const data = req.body;
        console.log("📦 Dados recebidos:", JSON.stringify(data));

        // Pega o status, não importa se está em 'status' ou 'order_status'
        const statusAtual = data?.status || data?.order_status;

        // Só prossegue se for aprovado/pago
        if (statusAtual === "approved" || statusAtual === "paid") {
            
            // O '?.mobile' evita o erro caso o cliente não exista no JSON
            const mobileRaw = data?.customer?.mobile;

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
                            email: data?.customer?.email || "",
                            nome: data?.customer?.name || "Guerreiro",
                            dataPagamento: new Date()
                        } 
                    },
                    { upsert: true }
                );

                console.log(`✅ VIP Ativado para: ${whatsappCliente}`);
            } else {
                console.log("⚠️ Webhook sem número de telefone.");
            }
        }

        // SEMPRE responde 200 para o Kiwify
        res.status(200).send("Recebido");

    } catch (err) {
        console.error("❌ Erro interno no Webhook:", err.message);
        res.status(200).send("Erro tratado");
    }
});
// --- ROTA 2: VALIDAR CÓDIGO (ENVIO MANUAL) ---
app.post("/api/usuarios/ativar-vip", async (req, res) => {
    const { whatsapp, codigo } = req.body;
    const whatsappLimpo = String(whatsapp).replace(/\D/g, "");

    try {
        // Busca usando 'WhatsApp' com W maiúsculo
        const usuario = await mongoose.connection.collection('usuários').findOne({ WhatsApp: whatsappLimpo });

        if (!usuario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        // Código mestre para você enviar no zap se o automático falhar
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

app.use("/api", receitasRoutes);

app.get("/", (req, res) => {
  res.send("API TreinoFit - Conectada ao Banco 'usuários'");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});