import express from 'express'
import { perguntaReceita } from '../controllers/receitas.controller.js'

const router = express.Router()

router.get("/", (req, res) => {
  res.json({ status: "Rota receitas ativa 🚀" })
})

router.post('/perguntar', perguntaReceita)

export default router