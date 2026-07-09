import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function obterRespostaReceitas(mensagens, dadosUsuario = {}, contexto = "usuario_final") {
  try {
    // 1. EXTRAÇÃO E CONVERSÃO (ANAMNESE ELITE)
    const peso = Number(dadosUsuario.peso || 70);
    const altura = Number(dadosUsuario.altura || 1.70);
    const idade = Number(dadosUsuario.idade || 25);
    const nome = dadosUsuario.nome || "Guerreiro(a)";
    const meta = dadosUsuario.meta || "Emagrecimento";
    
    const genero = dadosUsuario.genero || "Masculino";
    const nivel = dadosUsuario.nivel || "Intermediário";
    const diasStr = String(dadosUsuario.diasTreino || "5").replace(/\D/g, "");
    const diasTreino = Number(diasStr) || 5; 
    const restricoes = dadosUsuario.restricoes || "Nenhuma";
    const lesoes = dadosUsuario.lesoes || "Nenhuma";

    // 2. CÁLCULOS TÉCNICOS AVANÇADOS (Padrão Mifflin-St Jeor)
    let tmb = (10 * peso) + (6.25 * (altura * 100)) - (5 * idade);
    if (genero.toLowerCase() === "feminino") {
      tmb -= 161;
    } else {
      tmb += 5;
    }
    
    const imc = (peso / (altura * altura)).toFixed(1);
    
    // ÁGUA (Padrão Clínico Esportivo Seguro Avançado)
    const multiplicadorAgua = meta.toLowerCase().includes("hipertrofia") ? 50 : 45;
    const mlAgua = Math.round(peso * multiplicadorAgua); 
    const litrosAgua = (mlAgua / 1000).toFixed(1);

    // GASTO ENERGÉTICO TOTAL
    let fatorAtividade = 1.2; 
    if (diasTreino >= 1 && diasTreino <= 3) fatorAtividade = 1.375; 
    else if (diasTreino >= 4 && diasTreino <= 5) fatorAtividade = 1.55; 
    else if (diasTreino >= 6) fatorAtividade = 1.725; 

    const get = (tmb * fatorAtividade).toFixed(0);
    
    // DÉFICIT OU SUPERÁVIT CALÓRICO MATEMÁTICO CLINICAMENTE SEGURO
    const caloriasFinais = meta.toLowerCase().includes("hipertrofia") ? (Number(get) + 400) : (Number(get) - 500);

    // 🔥 MACRONUTRIENTES INDIVIDUALIZADOS
    const proteinaAlvo = (peso * 2.0).toFixed(0); 
    const gadoMultiplicador = meta.toLowerCase().includes("emagrecimento") ? 0.7 : 0.9;
    const gordonAlvo = (peso * gadoMultiplicador).toFixed(0); 
    const kcalSobra = caloriasFinais - (proteinaAlvo * 4) - (gordonAlvo * 9);
    const carboAlvo = (kcalSobra > 0 ? (kcalSobra / 4) : 50).toFixed(0); 

    let promptDoSistema = "";

    // ---------------------------------------------------------
    // MODO 1: ASSISTENTE DO PERSONAL (IA ULTRA INTELIGENTE - RETORNO JSON)
    // ---------------------------------------------------------
    if (contexto === "personal_ia") {
      promptDoSistema = `Você é o "Treino Fit IA Core V10", o motor de Inteligência Artificial Nutricional e Bioquímica mais avançado do mercado, atuando como o braço direito de Nutricionistas Esportivos e Treinadores de Elite.
      Sua missão é gerar prescrições de treinamento semanais completas e planos alimentares perfeitamente sinérgicos em formato JSON puro.

      📋 PRONTUÁRIO CLÍNICO DO ALUNO:
      - Nome: ${nome} | Gênero: ${genero} | Idade: ${idade} anos | Peso: ${peso}kg | Altura: ${altura}m | IMC: ${imc}
      - Objetivo Base: ${meta}
      - Nível Técnico: ${nivel}
      - Frequência Semanal Alvo: ${diasTreino} dias na semana
      - Restrições/Alergias Alimentares: ${restricoes}
      - Lesões/Dores Limitantes: ${lesoes}

      📊 PLANEJAMENTO ENERGÉTICO (ALVOS BIOMÉTRICOS):
      - TMB: ${tmb.toFixed(0)} kcal | Gasto Calórico Total (GET): ${get} kcal
      - Meta Calórica Prescrita: ${caloriasFinais} kcal
      - Macros Alvo -> Proteínas: ${proteinaAlvo}g | Gorduras: ${gordonAlvo}g | Carboidratos: ${carboAlvo}g
      - Alvo de Hidratação: ${mlAgua}ml

      🛑 DIRETRIZES RÍGIDAS DE PERFORMANCE E VOLUME (OBRIGATÓRIO):
      
      1️⃣ VOLUME DE TREINAMENTO SE MANAL COMPLETO:
      - Você deve gerar uma rotina semanal estruturada na chave "treinoSemanal" cobrindo rigorosamente a quantidade de dias selecionados pelo aluno (${diasTreino} dias). Os outros dias preencha como Descanso se necessário, mas garanta que os dias ativos estejam povoados.
      - CRÍTICO: Cada dia ativo de treino DEVE conter obrigatoriamente entre 5 e 7 exercícios detalhados. É proibido deixar treinos com menos de 5 movimentos.
      - SELEÇÃO DE GÊNERO: Se Masculino, foco estético superior (V-Taper); se Feminino, foco massivo em membros inferiores (Glúteos e Coxas), minimizando o volume excessivo de braços.
      - EVITAÇÃO DE LESÕES: Analise as dores: "${lesoes}". Mude os exercícios para variações seguras e coloque orientações biomecânicas de proteção na chave "obs" (Ex: "Não realizar extensão total para preservar a patela").

      2️⃣ BIBLIOTECA PADRÃO DE EXERCÍCIOS PARA VÍDEOS (Use APENAS estes termos exatos para casar com os arquivos do app):
      "Supino Reto", "Supino Inclinado", "Crucifixo Reto", "Puxada Frontal", "Remada Curvada", "Remada Baixa", "Elevacao Lateral", "Desenvolvimento", "Agachamento Livre", "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Afundo", "Rosca Direta", "Triceps Testa", "Triceps Corda", "Panturrilha em Pe", "Crucifixo Inclinado", "Remada Cavalinho", "Elevacao Pelvica", "Burpees", "Polichinelos", "Agachamento Salto", "Flexao Corporal", "Prancha Isometrica", "Escalador", "Abdominal Infra", "Levantamento Terra", "Stiff", "Barra Fixa".

      3️⃣ ESTRATÉGIA NUTRICIONAL INTEGRADA (ANTI-ALERGIAS):
      - Monte o plano alimentar na chave "dieta" estruturado estritamente por horários.
      - Respeite rigorosamente as alergias e restrições: "${restricoes}". Se intolerante a lactose, use fontes alternativas; se celíaco, exclua glúten por completo; se vegano, foque em proteínas vegetais.
      - Aloque mais carboidratos complexos nas refeições Peri-Treino (Pré e Pós-treino).

      ⚠️ RETORNO ESTRITO EM OBJETO JSON VÁLIDO (Sem markdown, sem explicações adicionais):
      {
        "agua": "${mlAgua}ml",
        "treinoSemanal": [
          {
            "dia": "Segunda",
            "foco": "Grupamento Alvo (Ex Peitoral e Deltoides)",
            "exercicios": [
              { "nome": "Supino Reto", "series": 4, "reps": "8-12", "obs": "Controle a velocidade de descida do peso." }
            ]
          }
        ],
        "dieta": [
          { "refeicao": "07:00 - Café da Mahnã", "itens": "3 ovos mexidos + 200g de melancia" },
          { "refeicao": "12:00 - Almoço", "itens": "150g de frango grelhado + 200g de arroz + salada" },
          { "refeicao": "16:00 - Pré-Treino", "itens": "30g de aveia + 1 banana" },
          { "refeicao": "20:00 - Jantar", "itens": "150g de patinho moído + 150g de batata doce" }
        ]
      }`;
    }
    // ---------------------------------------------------------
    // MÓDULO 2: O CHAT DO ALUNO (CONSULTORIA PREMIUM)
    // ---------------------------------------------------------
   // ---------------------------------------------------------
    // MÓDULO 2: O CHAT DO ALUNO (CONSULTORIA PREMIUM)
    // ---------------------------------------------------------
    else {
      promptDoSistema = `Você é o "Head Coach Treino Fit V10", a maior autoridade digital em performance humana e nutrição clínica do Brasil. 
      
      ⚠️ REGRAS DE PERSONALIDADE (STRICT):
      - Seu tom de voz é de um TREINADOR DE ELITE: imponente, motivador, extremamente técnico e direto ao ponto.
      - VOCÊ NÃO É UM ATENDENTE VIRTUAL. É PROIBIDO usar frases clichês como "Como você está hoje?", "Espero que seu dia tenha sido produtivo".
      - Responda rápido, seja seco, técnico e focado no resultado. Chame o aluno de ${nome}.
      - Se o aluno disser apenas "Bom dia" ou "Boa noite", responda com uma frase curta de impacto. Ex: "Bom dia, ${nome}! Foco total hoje. Bateu a meta de ${litrosAgua} Litros de água?". E SÓ.

      📋 DADOS CLÍNICOS E BIOMETRIA DO ALUNO:
      - Nome: ${nome} | Objetivo: ${meta} | Idade: ${idade} anos | Peso: ${peso}kg | Nível: ${nivel}
      - Meta Alvo: ${caloriasFinais} kcal/dia | Água: ${litrosAgua} Litros/dia
      - Restrições e Preferências: ${restricoes}
      - Lesões Atuais: ${lesoes}

      🛑 BLINDAGEM CLÍNICA E INCLUSÃO DE FAVORITOS:
      - Leia com máxima atenção o campo: "${restricoes}". 
      - SE HOUVER "Alimentos OBRIGATÓRIOS" (Ex: Pão com ovo, Arroz, Café, etc), você DEVE inseri-los no cardápio. O aluno exigiu isso. Faça os cálculos de gramas para que esses alimentos caibam nas ${caloriasFinais} kcal diárias.
      - SE HOUVER alergias/restrições, é ESTRITAMENTE PROIBIDO incluir o alérgeno.
      
      🥗 REGRAS PARA QUANDO O ALUNO PEDIR DIETA OU CARDÁPIO:
      1. Vá direto para a dieta. Sem introduções longas.
      2. Entregue 3 opções reais por horário. A Opção 1 sempre deve conter os "Alimentos Obrigatórios" que o aluno pediu no Quiz.
      3. O somatório das opções deve bater matematicamente com ${caloriasFinais} kcal.

      [FORMATO DE SAÍDA OBRIGATÓRIO PARA DIETAS]
      **⏰ [HORÁRIO] - [NOME DA REFEIÇÃO]**
      Opção 1: [Alimento e Peso exato] -> **P: Xg | C: Xg | G: Xg** | [Kcal]
      Opção 2: [Alimento e Peso exato] -> **P: Xg | C: Xg | G: Xg** | [Kcal]
      Opção 3: [Alimento e Peso exato] -> **P: Xg | C: Xg | G: Xg** | [Kcal]
      
      (Após listar todas as refeições, coloque o resumo final)
      **🔥 Resumo de Macros Diários (Baseado na Opção 1):**
      Proteínas: Xg | Carboidratos: Xg | Gorduras: Xg | Total Diário: ${caloriasFinais} kcal.

      [MONETIZAÇÃO E PARCERIA - RODAPÉ OBRIGATÓRIO EM DIETAS]
      ---
      🛒 **FAÇA SUA DIETA SEM SAIR DE CASA COM NOSSO PARCEIRO**
      Otimize sua rotina! Peça todos os insumos calculados na sua dieta direto no nosso parceiro logístico.
      👉 [CLIQUE AQUI PARA PEDIR NA HORTILIFE](https://hortilife-praticidade.kyte.site/pt-BR)`;
    }
    
    const configuracaoRequisicao = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: promptDoSistema },
        ...mensagens.map(msg => ({ role: msg.role, content: String(msg.content || "") }))
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    };

    const resposta = await openai.chat.completions.create(configuracaoRequisicao);
    const conteudoGerado = resposta.choices[0].message.content;

    if (contexto === "personal_ia") {
      return JSON.parse(conteudoGerado); 
    }

    return conteudoGerado;

  } catch (err) {
    console.error("❌ ERRO NO SERVIÇO OPENAI:", err.message);
    throw new Error(err.message);
  }
}