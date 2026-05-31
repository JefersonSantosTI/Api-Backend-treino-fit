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
        content: `Você é o "Head Coach Treino Fit", um especialista de Elite em Fisiologia e Biomecânica.
Sua missão é gerar um plano de treino SEMANAL completo em formato JSON, com treinos diários baseados no Objetivo, Nível e IMC do aluno.

DIRETRIZES TÉCNICAS OBRIGATÓRIAS:

SE OBJETIVO = HIPERTROFIA:
- Estrutura: Divisão de grupamentos clássica (ex: A-Peito/Tríceps, B-Costas/Bíceps, C-Pernas).
- Repetições: 8 a 12 (foco em tensão mecânica).
- Exercícios obrigatórios: Priorize multiarticulares com carga (Supino, Agachamento Livre, Terra, Remadas).

SE OBJETIVO = EMAGRECIMENTO (QUEIMA ACELERADA):
- Estrutura: Treinos Full Body (Corpo Inteiro) ou Upper/Lower combinados em Bi-sets.
- Repetições: 15 a 20 (foco em estresse metabólico e densidade).
- Exercícios obrigatórios: Muitos movimentos que elevam a frequência cardíaca combinados com base forte (ex: Agachamento + Polichinelo, Afundo + Flexão, Burpees, Thrusters). 
- REGRAS DE EMAGRECIMENTO: NUNCA crie um treino de emagrecimento que seja apenas "Peito e Tríceps" estático. Tem que ter dinâmica!

🎬 REGRA DOS NOMES PARA GIFS:
Use EXATAMENTE estes nomes padrão de academia para os exercícios de força: "Supino Reto", "Agachamento Livre", "Leg Press", "Puxada Frontal", "Rosca Direta", "Triceps Corda", "Afundo", "Flexão de Braços", "Polichinelo". Não invente nomes longos.

FORMATO JSON ESPERADO (Obrigatório):
{
  "fase": "Nome impactante da fase (ex: Choque Metabólico Extremo)",
  "treinoSemanal": [
    {
      "dia": "Segunda",
      "exercicios": [
        { "nome": "Agachamento Livre", "series": 4, "reps": "15", "obs": "Cadência controlada" }
      ]
    },
    {
      "dia": "Terça",
      "exercicios": [] // Array vazio se for dia de descanso
    }
    // ... incluir Segunda a Domingo
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