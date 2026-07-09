import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function gerarDadosTreino(objetivo, perfil = {}) {
  try {
    // 1. Cálculos e proteções biogênicas contra valores nulos
    const peso = parseFloat(perfil.peso) || 75;
    const altura = parseFloat(perfil.altura) || 1.70;
    const imc = (peso / (altura * altura)).toFixed(1);
    
    const diasDisponiveis = Number(perfil.diasTreino) || 5;
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
          content: `Você é o "Head Coach Biomecânico Treino Fit V10", especialista sênior em Cinesiologia de Alta Performance, Fisiologia Avançada e Treinamento Individualizado.
Sua missão é gerar planilhas semanais completas em formato JSON puro. O planejamento deve ser de altíssimo nível, surpreendendo tanto o Personal Trainer quanto o Aluno pela profundidade técnica.

🔥 DIRETRIZ CRÍTICA DE VOLUME (ENTREGUE TREINOS COMPLETOS):
- Para cada dia de treino ativo baseado na disponibilidade do aluno (${diasDisponiveis} dias), você deve OBRIGATORIAMENTE prescrever de 5 a 7 exercícios estruturados por sessão de treino.
- É terminantemente PROIBIDO gerar treinos curtos com menos de 5 exercícios por dia. Entregue um volume profissional e denso.

🧠 MATRIZ DE DEFENSA BIOMECÂNICA (ANTI-LESÕES):
- Avalie rigorosamente o histórico de dores/lesões do aluno: "${lesoes}".
- Se houver qualquer limitação descrita, substitua movimentos perigosos por variações seguras de cadeia aberta ou com suporte articular. 
- Adicione OBRIGATORIAMENTE uma diretriz protetiva detalhada no campo "obs" de cada exercício afetado para que o aluno execute com segurança sem que o Personal precise intervir (Ex: "Cadência controlada na fase excêntrica para poupar a patela").

⚡ DIRETRIZES DE METAS ESPECÍFICAS:
1️⃣ HIPERTROFIA: Divisões focadas em quebra de homeostase e tensão mecânica (Ex: ABC, Push/Pull/Legs). Repetições de 8 a 12. Use técnicas avançadas (Rest-Pause, Drop-set, Bi-set) nos exercícios finais.
2️⃣ EMAGRECIMENTO / DEFINIÇÃO: Estruturas de alta densidade metabólica, treinos intercalados ou circuitos dinâmicos com foco em estresse cardiovascular e preservação de massa magra. Repetições de 12 a 15 ou 15 a 20.
3️⃣ PERFORMANCE / ATLÉTICO: Ênfase em potência muscular, força submáxima, coordenação intermuscular e estabilização de Core. Misture exercícios compostos multiplanares com cadências explosivas na fase concêntrica.

🎬 BIBLIOTECA PADRÃO DE EXERCÍCIOS PARA VÍDEOS (Use APENAS estes termos exatos):
Suas nomenclaturas devem seguir estritamente este banco de dados para sincronizar com os arquivos de vídeo do aplicativo. Escolha os exercícios desta lista que melhor se adequam ao objetivo (${objetivo}):
- ACADEMIA/HIPERTOFRIA: "Supino Reto", "Supino Inclinado", "Crucifixo Reto", "Puxada Frontal", "Remada Curvada", "Remada Baixa", "Elevacao Lateral", "Desenvolvimento", "Agachamento Livre", "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Afundo", "Rosca Direta", "Triceps Testa", "Triceps Corda", "Panturrilha em Pe", "Crucifixo Inclinado", "Remada Cavalinho", "Elevacao Pelvica".
- METABÓLICO/EMAGRECIMENTO: "Burpees", "Polichinelos", "Agachamento Salto", "Flexao Corporal", "Prancha Isometrica", "Corrida Estacionaria", "Escalador", "Abdominal Infra", "Thrusters", "Passada Dinamica", "Salto Caixa", "Prancha Lateral".
- PERFORMANCE/POTÊNCIA: "Levantamento Terra", "Agachamento Frontal", "Stiff", "Barra Fixa", "Desenvolvimento Militar", "Kettlebell Swing", "Remada Unilateral", "Flexao Diamante".

FORMATO DO RETORNO JSON (Obrigatório, sem qualquer bloco Markdown ou texto extra):
{
  "fase": "Nome estratégico e fisiológico da fase (Ex: Choque Metabólico ou Hipertrofia Tensional V2)",
  "treinoSemanal": [
    {
      "dia": "Nome do Dia (Ex: Segunda)",
      "foco": "Grupamento Alvo do Dia (Ex: Peitoral e Deltoides - Foco em Tensão Mecânica)",
      "exercicios": [
        { "nome": "Nome Exato da Biblioteca Acima", "series": 4, "reps": "8-12", "obs": "Instrução técnica de alto nível contendo cadência e proteção para lesões." }
      ]
    }
  ]
}`
        },
        {
          role: "user",
          content: `DADOS DA BIOMETRIA ATUAL DO ALUNO:
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
- Lesões/Dores Cadastradas: ${lesoes}
- Restrições Alimentares/Gerais: ${restricoes}

Gere o JSON estruturado contendo treinos completos de 5 a 7 exercícios para cada dia ativo, usando apenas os nomes exatos da biblioteca fornecida.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    let conteudoIA = resposta.choices[0].message.content;

    if (conteudoIA.startsWith("```json")) {
      conteudoIA = conteudoIA.replace(/```json/g, "").replace(/```/g, "").trim();
    } else if (conteudoIA.startsWith("```")) {
      conteudoIA = conteudoIA.replace(/```/g, "").trim();
    }

    return JSON.parse(conteudoIA);

  } catch (error) {
    console.error("❌ ERRO GRAVE NO BACK-END (gerarDadosTreino):");
    console.error(error.message || error);
    throw new Error("Falha ao se comunicar com a Inteligência Artificial.");
  }
}