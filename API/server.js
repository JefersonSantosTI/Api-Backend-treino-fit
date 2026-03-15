import express from 'express'
import receitasRoutes from './src/routes/receitas.route.js'
import cors from 'cors'
import dotenv from "dotenv"
dotenv.config()



const app = express();
const PORT = 3000

app.use(cors())

app.use(express.json());

app.use('/receitas', receitasRoutes);

app.listen(PORT, () =>{
    console.log(`Servidor Rodando na Porta ${PORT}`);


})