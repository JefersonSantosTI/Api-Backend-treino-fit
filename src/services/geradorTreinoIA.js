// geradorTreinoIA.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function gerarDadosTreino(objetivo, perfil) {
  // 1. Cálculo automático do IMC para guiar a IA
  const peso = parseFloat(perfil.peso);
  const altura = parseFloat(perfil.altura);
  const imc = (peso / (altura * altura)).toFixed(1);

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Você é o "Head Coach Treino Fit", especialista em fisiologia do exercício.
        
Sua missão é gerar um plano de treino técnico em JSON baseado no objetivo e no IMC do aluno.

DIRETRIZES TÉCNICAS:
- SE OBJETIVO = HIPERTROFIA: Foco em Tensão Mecânica. Técnicas: Pirâmide, Rest-Pause, Pico de Contração. Reps: 8-12. Cardio: LISS (moderado).
- SE OBJETIVO = EMAGRECIMENTO: Foco em Estresse Metabólico. Técnicas: Drop-sets, Bi-sets, Cluster-sets. Reps: 12-15. Cardio: HIIT (intenso).

LOGICA DE IMC (IMC Atual: ${imc}):
- Se IMC > 30: Cardio mais agressivo e foco em controle articular.
- Se IMC < 25: Foco total em carga e construção de densidade.

FORMATO OBRIGATÓRIO (JSON):
{
  "fase": "Nome da Fase (ex: Choque Metabólico, Hipertrofia Funcional)",
  "frase_coach": "Frase técnica e motivacional curta",
  "treino": [
    {
      "nome": "Nome Técnico (ex: Supino Inclinado com Halteres)", 
      "series": "4", 
      "reps": "8 a 12", 
      "obs": "Instrução de cadência (ex: 3s na fase negativa)", 
      "tecnica": "Técnica avançada aplicada"
    }
  ],
  "cardio": "Protocolo específico detalhado"
}`
      },
      {
        role: "user",
        content: `Aluno com IMC ${imc}. Objetivo: ${objetivo}. Gere um plano de elite.`
      }
    ],
    response_format: { type: "json_object" }
  });

  // Retorna o objeto já tratado
  return JSON.parse(resposta.choices[0].message.content);
}