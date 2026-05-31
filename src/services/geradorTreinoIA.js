import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function gerarDadosTreino(objetivo, perfil) {
  // 1. Cálculos e extração de dados com proteção
  const peso = parseFloat(perfil.peso) || 75;
  const altura = parseFloat(perfil.altura) || 1.70;
  const imc = (peso / (altura * altura)).toFixed(1);
  
  const diasDisponiveis = perfil.diasTreino || 5;
  const idade = perfil.idade || 25;
  const nivel = perfil.nivel || "Intermediário";
  const restricoes = perfil.restricoes || "Nenhuma";
  const lesoes = perfil.lesoes || "Nenhuma";
  
  // 2. Extração das novidades (com valores padrão caso o usuário não preencha)
  const tempoTreino = perfil.tempoTreino || "60 minutos";
  const localTreino = perfil.localTreino || "Academia Completa";
  const focoEspecifico = perfil.focoEspecifico || "Geral";

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Você é o "Head Coach Treino Fit", um especialista de Elite em Fisiologia e Biomecânica.
A sua missão é gerar um plano de treino SEMANAL completo e ultra-personalizado em formato JSON.

🧠 DIRETRIZ DE DECISÃO CLÍNICA E INTELIGÊNCIA DO SISTEMA:
Analise o IMC, Peso, Nível e Objetivo Solicitado pelo aluno.
1. SE OCORRER CONFLITO CLÍNICO (Ex: Pediu "Hipertrofia" mas o IMC é > 26 ou indica sobrepeso):
   - O corpo deste aluno precisa primeiro baixar o % de gordura para otimizar hormônios. O treino DEVE focar em Estresse Metabólico e Emagrecimento (15-20 reps, bi-sets, alta dinâmica).
   - JUSTIFIQUE a estratégia na "fase" para gerar autoridade. Exemplo: "Fase 1: Preparação Metabólica (Adequação de % de Gordura para futura Hipertrofia)".
2. SE ALINHADO: Siga o protocolo padrão do objetivo de forma agressiva. Ex de fase: "Hipertrofia Absoluta" ou "Queima Acelerada Extrema".

⚡ REGRAS DE ADAPTAÇÃO AO PERFIL (MUITO IMPORTANTE):
- TEMPO DE TREINO: Adapte o volume (número de séries/exercícios) para o treino caber EXATAMENTE no tempo disponível do aluno. Se o tempo for curto, use circuitos ou bi-sets.
- LOCAL DE TREINO: Prescreva APENAS exercícios possíveis para o local escolhido. Se for "Casa", use peso corporal. NUNCA prescreva máquinas se o treino for em casa.
- FOCO ESPECÍFICO: O primeiro e/ou segundo exercício do dia DEVE ser focado no grupo muscular que o aluno deseja priorizar.
- LESÕES/RESTRIÇÕES: Evite categoricamente qualquer movimento que agrave as lesões informadas.

DIRETRIZES TÉCNICAS BASE:
- HIPERTROFIA: Divisão clássica (ABC), 8 a 12 reps, tensão mecânica. Priorize carga e descanso.
- EMAGRECIMENTO: Full Body ou Upper/Lower combinados. 15 a 20 reps, exercícios que elevam a frequência cardíaca. NUNCA crie treinos estáticos para emagrecimento.

🎬 REGRA DOS NOMES PARA GIFS (OBRIGATÓRIO E ESTRITO):
Use EXATAMENTE estes nomes padrão para os exercícios: "Supino Reto", "Agachamento Livre", "Leg Press", "Puxada Frontal", "Rosca Direta", "Triceps Corda", "Afundo", "Flexao Corporal", "Polichinelos", "Desenvolvimento", "Mesa Flexora", "Cadeira Extensora", "Burpees", "Thrusters", "Prancha Isometrica". Não invente nomes longos ou variações.

FORMATO JSON ESPERADO (Obrigatório, sem markdown extra fora do JSON):
{
  "fase": "Nome estratégico e clínico da fase",
  "treinoSemanal": [
    {
      "dia": "Segunda",
      "exercicios": [
        { "nome": "Agachamento Livre", "series": 4, "reps": "15 a 20", "obs": "Cadência controlada para máxima oxidação" }
      ]
    },
    {
      "dia": "Terça",
      "exercicios": [] // Array vazio se for dia de descanso
    }
  ]
}`
      },
      {
        role: "user",
        content: `DADOS DA BIOMETRIA DO ALUNO:
- Objetivo Solicitado: ${objetivo}
- Idade: ${idade} anos
- Peso: ${peso} kg
- Altura: ${altura} m
- IMC: ${imc}
- Nível de Experiência: ${nivel}
- Dias disponíveis por semana: ${diasDisponiveis} dias
- Tempo por Sessão: ${tempoTreino}
- Local de Treino: ${localTreino}
- Foco Corporal Específico: ${focoEspecifico}
- Lesões/Dores: ${lesoes}
- Restrições: ${restricoes}

Baseado nestes dados cruzados, atue como o Head Coach e gere a planilha semanal em JSON.`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  return JSON.parse(resposta.choices[0].message.content);
}