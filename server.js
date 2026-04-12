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

// --- ROTA 1: WEBHOOK KIWIFY (VERSÃO CORRIGIDA PARA MAIÚSCULAS) ---
app.post("/webhook-kiwify", async (req, res) => {
    try {
        const data = req.body;
        console.log("📦 Dados recebidos do Kiwify!");

        // O Kiwify pode enviar 'Customer' ou 'customer'
        const cliente = data.Customer || data.customer;
        const statusAtual = data.order_status || data.status;

        console.log(`Status: ${statusAtual} | Cliente encontrado: ${cliente ? 'Sim' : 'Não'}`);

        if ((statusAtual === "paid" || statusAtual === "approved") && cliente) {
            
            const mobileRaw = cliente.mobile;

            if (mobileRaw) {
                // Limpa o número (remove + e espaços)
                const whatsappCliente = mobileRaw.replace(/\D/g, "");
                
                // Define 1 ano de acesso
                const dataExpiracao = new Date();
                dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

                // ATUALIZA NO BANCO (usando W maiúsculo em WhatsApp conforme seu print)
                const resultado = await mongoose.connection.collection('usuários').updateOne(
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
                    { upsert: true } // Se não existir, ele cria!
                );

                console.log(`✅ SUCESSO: VIP Ativado para o WhatsApp: ${whatsappCliente}`);
            } else {
                console.log("⚠️ O objeto cliente existe, mas o campo 'mobile' está vazio.");
            }
        } else {
            console.log("ℹ️ Webhook recebido, mas não é uma aprovação de pagamento.");
        }

        res.status(200).send("OK");

    } catch (err) {
        console.error("❌ Erro processando Webhook:", err.message);
        res.status(200).send("Erro Interno");
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