import express from 'express';
import {perguntaReceita} from '../controllers/receitas.controller.js';

const router = express.Router()

router.post('/perguntar',perguntaReceita)


export default router;