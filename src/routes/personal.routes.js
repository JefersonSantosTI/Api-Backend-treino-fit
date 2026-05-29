import express from "express";
import { autenticarPersonal } from "../controllers/personal.controller.js"; // Garanta que o nome do arquivo aqui combine com o seu controlador

const router = express.Router();

// ✅ Cria a ponte que o Front-end precisa para o login funcionar
router.post("/personal/auth", autenticarPersonal);

export default router;