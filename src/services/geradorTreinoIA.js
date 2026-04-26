// geradorTreinoIA.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function gerarDadosTreino(objetivo, perfil) {
  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Você é o "Head Coach Treino Fit". Seu objetivo é gerar treinos de alta performance.
Ao receber os dados do aluno, você deve dividir o plano em:

1. FASE ATUAL: Ex: "Choque", "Adaptação" ou "Densidade Máxima".
2. EXERCÍCIOS: Com nome técnico, séries, repetições e a "Técnica Avançada" (Ex: Drop-set, Rest-pause, Pico de contração).
3. CARDIO: Protocolo específico (HIIT ou LISS).
4. INSIGHT DO COACH: Uma frase de motivação técnica baseada no objetivo.

FORMATO OBRIGATÓRIO (JSON):
{
  "fase": "Nome da Fase",
  "frase_coach": "Frase motivacional",
  "treino": [
    {"nome": "Supino Inclinado", "series": "4", "reps": "8 a 12", "obs": "3s de descida controlada", "tecnica": "Rest-Pause na última série"},
    {"nome": "...", "series": "...", "reps": "...", "obs": "...", "tecnica": "..."}
  ],
  "cardio": "Protocolo de 15min HIIT após o treino"
}`
      },
      {
        role: "user",
        content: `Gere um treino de ${objetivo}`
      }
    ],
    response_format: { type: "json_object" } // Isso garante que a OpenAI mande um JSON puro
  });

  return JSON.parse(resposta.choices[0].message.content);
}