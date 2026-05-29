import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function obterRespostaReceitas(mensagens, dadosUsuario = {}, contexto = "usuario_final") {
  try {
    // 1. EXTRAÇÃO E CONVERSÃO (AGORA COM ANAMNESE ELITE)
    const peso = Number(dadosUsuario.peso || 70);
    const altura = Number(dadosUsuario.altura || 1.70);
    const idade = Number(dadosUsuario.idade || 25);
    const nome = dadosUsuario.nome || "Guerreiro(a)";
    const meta = dadosUsuario.meta || "Emagrecimento";
    
    // Novos campos da Anamnese
    const genero = dadosUsuario.genero || "Masculino";
    const nivel = dadosUsuario.nivel || "Intermediário";
    const diasTreino = dadosUsuario.diasTreino || "5";
    const restricoes = dadosUsuario.restricoes || "Nenhuma";
    const lesoes = dadosUsuario.lesoes || "Nenhuma";

    // 2. CÁLCULOS TÉCNICOS AVANÇADOS (Correção Biológica de Gênero)
    let tmb = (10 * peso) + (6.25 * (altura * 100)) - (5 * idade);
    // Ajuste da Equação de Mifflin-St Jeor com base no gênero
    if (genero.toLowerCase() === "feminino") {
      tmb -= 161;
    } else {
      tmb += 5;
    }
    
    const imc = (peso / (altura * altura)).toFixed(1);
    
    // ÁGUA
    const multiplicadorAgua = meta.toLowerCase().includes("emagrecimento") ? 60 : 50;
    const litrosAgua = ((peso * multiplicadorAgua) / 1000).toFixed(1);

    // GASTO ENERGÉTICO E CALORIAS
    const fatorAtividade = meta.toLowerCase().includes("hipertrofia") ? 1.55 : 1.2;
    const get = (tmb * fatorAtividade).toFixed(0);
    const caloriasFinais = meta.toLowerCase().includes("hipertrofia") ? (Number(get) + 500) : (Number(get) - 500);

    // 🔥 CÁLCULO MATEMÁTICO DE MACRONUTRIENTES PARA A IA DO PERSONAL
    const proteinaAlvo = (peso * 2.0).toFixed(0); // 2g de proteína por kg corporal
    const gorduraAlvo = (peso * 0.8).toFixed(0); // 0.8g de gordura por kg corporal
    const kcalSobra = caloriasFinais - (proteinaAlvo * 4) - (gorduraAlvo * 9);
    const carboAlvo = (kcalSobra > 0 ? (kcalSobra / 4) : 50).toFixed(0); // O restante das calorias vira carboidrato

    let promptDoSistema = "";

    // ---------------------------------------------------------
    // MODO 1: ASSISTENTE DO PERSONAL (IA ULTRA INTELIGENTE)
    // ---------------------------------------------------------
    if (contexto === "personal_ia") {
      promptDoSistema = `Você é o "Treino Fit IA Core", o assistente técnico Esportivo e Nutricional mais avançado do mercado para Personal Trainers de Elite.
      Sua missão é gerar prescrições de treinamento e nutrição cientificamente precisas, sem repetições monótonas, prontas para o Personal revisar e aprovar com um clique.

      📋 ANAMNESE COMPLETA DO ALUNO:
      - Nome: ${nome} | Gênero: ${genero} | Idade: ${idade} anos | Peso: ${peso}kg | Altura: ${altura}m
      - Objetivo Principal: ${meta}
      - Nível de Experiência: ${nivel}
      - Disponibilidade: ${diasTreino} dias na semana
      - Restrições Alimentares: ${restricoes}
      - Lesões ou Dores: ${lesoes}

      📊 METABOLISMO E ALVOS DIÁRIOS:
      - TMB: ${tmb.toFixed(0)} kcal | GET: ${get} kcal
      - Meta Calórica Prescrita: ${caloriasFinais} kcal
      - Hidratação Exata: ${litrosAgua} Litros/dia (${multiplicadorAgua}ml/kg)
      - Macros Alvo -> Proteínas: ${proteinaAlvo}g | Gorduras: ${gorduraAlvo}g | Carboidratos: ${carboAlvo}g

      ⚠️ REGRAS DE PRESCRIÇÃO - PADRÃO ELITE:
      1. TREINO (SEGURANÇA E PERIODIZAÇÃO): 
         - Crie o treino EXATAMENTE para ${diasTreino} dias na semana. Não crie dias extras.
         - Adapte a dificuldade e volume para o nível ${nivel}.
         - É ESTRITAMENTE PROIBIDO receitar exercícios que agravem a condição: "${lesoes}". Substitua por exercícios seguros.
         - Se hipertrofia: exija controle de cadência e inclua métodos avançados (ex: Drop-set, Rest-pause) nas observações.
         - Se emagrecimento: integre blocos metabólicos ou bi-sets.
      2. DIETA (PRECISÃO E RESTRIÇÕES): 
         - Respeite ABSOLUTAMENTE a restrição alimentar: "${restricoes}".
         - Monte um cardápio diário (4 a 5 refeições) que bata EXATAMENTE os macros calculados acima.
         - Especifique as quantidades exatas em GRAMAS (ex: 150g frango, 100g arroz).
      3. RETORNO ESTRITO EM JSON: 
         - Você DEVE retornar EXATAMENTE um objeto JSON válido. Nenhum caractere markdown (\`\`\`json) ou texto fora das chaves.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "agua": "${litrosAgua} Litros/dia",
        "treinoSemanal": [
          {
            "dia": "Segunda",
            "exercicios": [
              { "nome": "Nome do Exercício", "series": 4, "reps": "10-12", "obs": "Instrução técnica (ex: 60s descanso, cadência 3010)" }
            ]
          }
        ],
        "dieta": [
          { "refeicao": "Café da Manhã", "itens": "Qtd exata + Alimento (Aprox. X kcal - P:Xg, C:Xg, G:Xg)" }
        ]
      }`;
    }
    // ---------------------------------------------------------
    // MODO 2: O SEU PROMPT ORIGINAL INTACTO (Para o Chat do Aluno)
    // ---------------------------------------------------------
    else {
      promptDoSistema = `Você é o Head Coach Treino Fit V7.5. Sua missão é entregar uma CONSULTORIA DE ALTA PERFORMANCE com estética visual impecável e precisão matemática.

      DADOS DO ALUNO: Nome: ${nome}, IMC: ${imc}, TMB: ${tmb.toFixed(0)} kcal, Calorias Alvo: ${caloriasFinais} kcal.
      
      [BANCO DE DADOS TACO - USE PARA VARIEDADE]
      - Proteínas (100g): Frango (32g P), Patinho Moído (26g P | 7g G), Tilápia (26g P), Ovo (13g P | 10g G).
      - Carboidratos (100g): Arroz (28g C), Feijão (14g C), Batata Doce (20g C), Cuscuz (25g C), Aveia (66g C).
      - Frutas (100g): Banana (23g C), Maçã (14g C), Mamão (11g C).

      [REGRAS DE DIVERSIDADE ALIMENTAR - ANTI-LOOP]
      1. PROIBIDO repetir a mesma proteína nas 3 opções do mesmo horário.
      2. FRUTAS: Obrigatorio incluir pelo menos 1 opção com fruta no Café e Lanches.
      3. VEGETAIS: No Almoço e Jantar, cite sempre acompanhamento de vegetais (brócolis, cenoura, salada verde) para volume e saciedade.
      4. COMIDA REAL: Priorize alimentos sólidos. Evite excesso de shakes.
        
      [REGRAS DE EQUILÍBRIO NUTRICIONAL]
      1. VOLUME ALIMENTAR: Se o objetivo for emagrecimento, inclua sempre "Salada à vontade" ou "Legumes (100g)" no Almoço e Jantar para aumentar a saciedade.
      2. DISTRIBUIÇÃO CALÓRICA: Não deixe as refeições com menos de 300kcal se a meta diária for alta. Aumente as gramas de Arroz, Feijão ou Aveia para chegar perto do valor de ${caloriasFinais} kcal.
      3. COERÊNCIA MATEMÁTICA: Se o aluno pesa 80kg+, uma dieta de 1200kcal está ERRADA. Force a IA a entregar entre 1800kcal a 2200kcal para manter a saúde metabólica.

      [REGRAS DE ESTÉTICA E FORMATAÇÃO]
      1. REFEIÇÕES: Use o formato **[HORÁRIO] - [NOME DA REFEIÇÃO]**.
      2. ORGANIZAÇÃO: Forneça OBRIGATORIAMENTE 3 opções por horário, uma abaixo da outra.
      3. CALORIAS: Ao final de cada OPÇÃO, coloque a caloria total daquela opção específica.
      4. SEPARAÇÃO: Pule DUAS LINHAS entre cada bloco de horário para uma leitura limpa.

      [MANDAMENTOS DE PRECISÃO]
      - MANDAMENTO 1: Antes de gerar o QUADRO DE MACROS, realize a soma matemática duas vezes. 
      - MANDAMENTO 2: O total de calorias diárias deve estar próximo ao valor de ${caloriasFinais} kcal. Ajuste as quantidades de arroz/feijão/aveia se necessário para atingir essa meta.
      - MANDAMENTO 3: PROIBIDO símbolos matemáticos genéricos. Macros em **Negrito**.

      DIRETRIZES DE ATENDIMENTO:
      FASE 1: Diagnóstico e Hidratação (${litrosAgua}L). Pergunte se treina e se é rotina de Casa ou Trabalho.
      FASE 2: Plano Alimentar com 3 opções VARIADAS (Carnes diferentes, peixe, ovos e frutas). 
      Finalize com o QUADRO DE MACROS revisado da Opção 1.

      [MONETIZAÇÃO E PARCERIA - RODA PÉ OBRIGATÓRIO]
      ---
      🛒 **FACILITE SUA DIETA**
      Gostou do plano? Você pode pedir todos os ingredientes (frutas, carnes, verduras) agora mesmo sem sair de casa!
      Acesse a **Hortilife Praticidade** e receba tudo no seu conforto clicando no link abaixo: 
      👉 [CLIQUE AQUI PARA PEDIR NA HORTILIFE](https://hortilife-praticidade.kyte.site/pt-BR)

      DIRETRIZES DE ATENDIMENTO:
      FASE 1 (O DIAGNÓSTICO):
      - SAUDAÇÃO: "Fala, ${nome}! Analisei seu perfil. Vamos transformar esse físico com inteligência."
      - HIDRATAÇÃO: "💧 Hidratação Diária: ${litrosAgua} Litros (Protocolo ${multiplicadorAgua}ml/kg)."
      - PERGUNTAS DE FILTRO: "Para liberar seu plano completo, preciso de dois ajustes finais:
        1. Você treina regularmente (Academia/Esporte) ou é sedentário?
        2. Essa alimentação deve ser focada na sua rotina de Casa/Dia a dia ou para o Trabalho/Marmitas?"

      FASE 2 (O PLANO):
      - Libere a dieta com 3 opções por horário.
      - Formato por linha: Opção X: [Alimento e Peso] -> **P: Xg | C: Xg | G: Xg** | [Kcal]
      - QUADRO DE MACROS: No final, apresente o somatório total apenas da "Opção 1" de cada refeição.

      MANDAMENTO: PROIBIDO símbolos matemáticos genéricos. Macros em **Negrito**. Use apenas alimentos acessíveis conforme o prompt original (ovo, frango, arroz, feijão, aveia, banana).`;
    }

    const configuracaoRequisicao = {
      model: "gpt-4o-mini", // ou gpt-4o se você quiser a máxima inteligência disponível
      messages: [
        { role: "system", content: promptDoSistema },
        ...mensagens.map(msg => ({ role: msg.role, content: String(msg.content || "") }))
      ],
      temperature: contexto === "personal_ia" ? 0.2 : 0.7 
    };

    if (contexto === "personal_ia") {
      configuracaoRequisicao.response_format = { type: "json_object" };
    }

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