import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function gerarDadosTreino(objetivo, perfil = {}) {
  try {
    // 1. Cálculos com proteção extrema contra undefined
    const peso = parseFloat(perfil.peso) || 75;
    const altura = parseFloat(perfil.altura) || 1.70;
    const imc = (peso / (altura * altura)).toFixed(1);
    
    const diasDisponiveis = perfil.diasTreino || 5;
    const idade = perfil.idade || 25;
    const nivel = perfil.nivel || "Intermediário";
    const restricoes = perfil.restricoes || "Nenhuma";
    const lesoes = perfil.lesoes || "Nenhuma";
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

⚡ REGRAS DE ADAPTAÇÃO AO PERFIL:
- TEMPO DE TREINO: Adapte o volume para o tempo disponível do aluno.
- LOCAL DE TREINO: Prescreva APENAS exercícios possíveis para o local. Se for "Casa", use peso corporal.
- FOCO ESPECÍFICO: O primeiro exercício do dia DEVE ser focado no grupo muscular que o aluno deseja priorizar.
- LESÕES/RESTRIÇÕES: Evite qualquer movimento que agrave as lesões informadas.

DIRETRIZES TÉCNICAS BASE:
- HIPERTROFIA: Divisão clássica (ABC), 8 a 12 reps, tensão mecânica.
- EMAGRECIMENTO: Full Body ou Upper/Lower combinados. 15 a 20 reps. NUNCA crie treinos estáticos para emagrecimento.

🎬 REGRA DOS NOMES PARA GIFS (OBRIGATÓRIO E ESTRITO):
Use EXATAMENTE estes nomes padrão: "Supino Reto", "Agachamento Livre", "Leg Press", "Puxada Frontal", "Rosca Direta", "Triceps Corda", "Afundo", "Flexao Corporal", "Polichinelos", "Desenvolvimento", "Mesa Flexora", "Cadeira Extensora", "Burpees", "Thrusters", "Prancha Isometrica". Não invente nomes longos.

FORMATO JSON ESPERADO (Obrigatório, sem markdown extra):
{
  "fase": "Nome estratégico e clínico da fase",
  "treinoSemanal": [
    {
      "dia": "Segunda",
      "exercicios": [
        { "nome": "Agachamento Livre", "series": 4, "reps": "15 a 20", "obs": "Cadência controlada" }
      ]
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

Gere a planilha semanal OBRIGATORIAMENTE no formato JSON solicitado.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    let conteudoIA = resposta.choices[0].message.content;

    // 🔥 BLINDAGEM DE JSON: Remove formatações Markdown que a OpenAI às vezes insere
    if (conteudoIA.startsWith("```json")) {
      conteudoIA = conteudoIA.replace(/```json/g, "").replace(/```/g, "").trim();
    } else if (conteudoIA.startsWith("```")) {
      conteudoIA = conteudoIA.replace(/```/g, "").trim();
    }

    return JSON.parse(conteudoIA);

  } catch (error) {
    // 🔥 LOG DE ERRO PRECISO: Vai mostrar no painel do Render exatamente o que falhou
    console.error("❌ ERRO GRAVE NO BACK-END (gerarDadosTreino):");
    console.error(error.message || error);
    throw new Error("Falha ao se comunicar com a Inteligência Artificial.");
  }
}