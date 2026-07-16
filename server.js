import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// ✅ NOVOS IMPORTS DO SOCKET.IO E HTTP MANTENDO O RESTO INTACTO
import http from "http";
import { Server } from "socket.io";

// --- IMPORTAÇÃO DAS ROTAS ---
import receitasRoutes from "./src/routes/receitas.route.js"; 
import alunoRoutes from "./src/routes/aluno.routes.js"; 
import personalRoutes from "./src/routes/personal.routes.js";

// ✅ SERVIÇO DE AUTOMAÇÃO E LEMBRETES (Cron Job rodando em background)
import "./src/services/lembreteAgua.service.js"; 

const app = express();

// ✅ NOVO: MIDDLEWARE PARA CORRIGIR O BLOQUEIO DO window.postMessage (COOP)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// ✅ CRIANDO O SERVIDOR HTTP E O SOCKET.IO (A MÁGICA DO TEMPO REAL)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://treinofit.app.br",
      "https://www.treinofit.app.br",
      "https://front-end-api-nv55.onrender.com", 
      "http://localhost:5173", 
      "http://localhost:3000",
      "https://front-end-total-treino.onrender.com", // ✅ Link temporário do Total Treino
      "https://totaltreino.com.br",                  // ✅ Domínio oficial do cliente
      "https://www.totaltreino.com.br"               // ✅ Domínio oficial com www
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ CONFIGURAÇÃO DOS EVENTOS DO SOCKET.IO
io.on("connection", (socket) => {
  console.log(`🔌 Novo cliente conectado no Socket: ${socket.id}`);

  // Quando o front-end (aluno ou personal) pedir para entrar na sala de espera
  socket.on("entrar_sala_pagamento", (email) => {
    socket.join(email);
    console.log(`👤 Usuário aguardando pagamento na sala do email: ${email}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Cliente desconectado do Socket: ${socket.id}`);
  });
});

// ✅ DISPONIBILIZANDO O 'IO' PARA TODAS AS ROTAS E CONTROLLERS
app.set("io", io);

// --- CONFIGURAÇÃO DO CORS (PROTEÇÃO DA API) ---
const allowedOrigins = [
  "https://treinofit.app.br",
  "https://www.treinofit.app.br",
  "https://front-end-api-nv55.onrender.com", 
  "http://localhost:5173", 
  "http://localhost:3000",
  "https://front-end-total-treino.onrender.com",     // ✅ Link temporário do Total Treino
  "https://totaltreino.com.br",                      // ✅ Domínio oficial do cliente
  "https://www.totaltreino.com.br"                   // ✅ Domínio oficial com www
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "A política CORS deste servidor não permite acesso a partir da origem especificada.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json()); 

// --- CONEXÃO BANCO DE DADOS ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado com sucesso!"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// --- ROTA RAIZ (Aviso de status da API) ---
app.get("/", (req, res) => {
  res.send("API TreinoFit - Online e Sincronizada");
});

// --- ROTAS DA API ---
app.use("/api", receitasRoutes);
app.use("/api", alunoRoutes); 
app.use("/api", personalRoutes);

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 10000;
// ✅ ATENÇÃO: Mudou de app.listen para server.listen para o Socket.io funcionar!
server.listen(PORT, () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});