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
// --- ROTA 1: WEBHOOK KIWIFY (ATIVAÇÃO AUTOMÁTICA) ---
app.post("/webhook-kiwify", async (req, res) => {
    // A Kiwify envia 'order_status', mas o campo principal costuma ser 'status'
    const { status, order_status, customer } = req.body;
    const situacao = status || order_status;

    if (situacao === "paid" || situacao === "approved") {
        try {
            const whatsappCliente = customer.mobile ? customer.mobile.replace(/\D/g, "") : null;
            
            if (!whatsappCliente) {
                return res.status(200).send("Sem telefone");
            }

            const dataExpiracao = new Date();
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

            // O segredo está no { upsert: true }: se o usuário não existir, ele CRIA na hora
            await mongoose.connection.collection('usuários').updateOne(
                { WhatsApp: whatsappCliente }, 
                { 
                    $set: { 
                        pago: true, 
                        expiraEm: dataExpiracao,
                        email: customer.email,
                        nome: customer.name, // Já salva o nome que ele usou no cartão
                        dataPagamento: new Date()
                    } 
                },
                { upsert: true } 
            );

            console.log(`✅ VIP Ativado/Criado via WhatsApp: ${whatsappCliente}`);
        } catch (err) {
            console.error("❌ Erro no Webhook:", err);
        }
    }
    res.status(200).send("OK");
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