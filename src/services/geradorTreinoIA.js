import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function gerarDadosTreino(objetivo, perfil) {
  // 1. Cálculo automático do IMC com proteção contra valores vazios (NaN)
  const peso = parseFloat(perfil.peso) || 75;
  const altura = parseFloat(perfil.altura) || 1.70;
  const imc = (peso / (altura * altura)).toFixed(1);
  const diasDisponiveis = perfil.diasTreino || 5;

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Você é o "Head Coach Treino Fit", especialista em fisiologia do exercício de Elite.
        
Sua missão é gerar um plano de treino SEMANAL em JSON, altamente organizado e focado no objetivo do aluno.

🎯 DIRETRIZES TÉCNICAS E METABÓLICAS:
- SE OBJETIVO = HIPERTROFIA: Foco em Tensão Mecânica. Reps: 8-12. Cardio: LISS.
- SE OBJETIVO = EMAGRECIMENTO: Foco em Estresse Metabólico. Reps: 12-15. Cardio: HIIT.
- LOGICA DE IMC (${imc}): Se > 30, controle articular rígido. Se < 25, foco em carga base.

⚠️ REGRAS DE ORGANIZAÇÃO (DIVISÃO SEMANAL):
- Você DEVE distribuir o treino em dias da semana lógicos (Ex: Segunda a Sexta).
- Agrupe músculos de forma clássica (Ex: Peito/Tríceps, Costas/Bíceps, Pernas). Não misture sem lógica.
- Limite de 7 a 8 exercícios no máximo por dia.

🎬 REGRA DE OURO PARA OS GIFs (NOMENCLATURA):
Para que o nosso sistema de vídeos funcione, USE APENAS NOMES CLÁSSICOS E SIMPLES DE ACADEMIA.
- ✅ Certo: "Agachamento Livre", "Supino Reto", "Triceps Corda", "Rosca Direta", "Leg Press", "Puxada Frontal"
- ❌ Errado (Não invente): "Supino Reto com Rotação Inversa", "Agachamento Livre com salto duplo"

FORMATO OBRIGATÓRIO (JSON):
{
  "fase": "Nome da Fase (ex: Choque Metabólico, Hipertrofia Base)",
  "frase_coach": "Frase técnica e motivacional curta",
  "cardio": "Protocolo de cardio (ex: 20 min HIIT pós-treino)",
  "treinoSemanal": [
    {
      "dia": "Segunda",
      "foco": "Peito e Tríceps",
      "exercicios": [
        { 
          "nome": "Supino Reto", 
          "series": 4, 
          "reps": "8 a 12", 
          "obs": "Foco na cadência 3010" 
        }
      ]
    },
    {
      "dia": "Terça",
      "foco": "Costas e Bíceps",
      "exercicios": [
        { 
          "nome": "Puxada Frontal", 
          "series": 4, 
          "reps": "10 a 12", 
          "obs": "Aperte as escápulas" 
        }
      ]
    }
  ]
}`
      },
      {
        role: "user",
        content: `Aluno com IMC ${imc}. Objetivo: ${objetivo}. Treina ${diasDisponiveis} dias/semana. Gere a planilha semanal estruturada.`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3 // Temperatura baixa para garantir que a IA não "invente" nomes bizarros para os exercícios
  });

  return JSON.parse(resposta.choices[0].message.content);
}