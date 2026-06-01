import express from "express";
// ✅ ATUALIZADO: Importamos o processarWebhookKiwify junto com o autenticarPersonal
import { autenticarPersonal, processarWebhookKiwify } from "../controllers/personal.controller.js"; 

const router = express.Router();

// ✅ Cria a ponte que o Front-end precisa para o login funcionar
router.post("/personal/auth", autenticarPersonal);

// ✅ NOVA ROTA: O recebedor invisível dos pagamentos da Kiwify
router.post("/webhook-kiwify", processarWebhookKiwify);

export default router;