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
    
    // ÁGUA (Padrão Clínico Esportivo Seguro)
    const multiplicadorAgua = meta.toLowerCase().includes("hipertrofia") ? 50 : 40;
    const litrosAgua = ((peso * multiplicadorAgua) / 1000).toFixed(1);

    // GASTO ENERGÉTICO TOTAL (Fator de Atividade Realista baseado na frequência)
    let fatorAtividade = 1.2; // Sedentário base
    if (diasTreino >= 1 && diasTreino <= 3) fatorAtividade = 1.375; // Leve
    else if (diasTreino >= 4 && diasTreino <= 5) fatorAtividade = 1.55; // Moderado
    else if (diasTreino >= 6) fatorAtividade = 1.725; // Intenso

    const get = (tmb * fatorAtividade).toFixed(0);
    
    // DÉFICIT OU SUPERÁVIT CALÓRICO MATEMÁTICO
    const caloriasFinais = meta.toLowerCase().includes("hipertrofia") ? (Number(get) + 400) : (Number(get) - 500);

    // 🔥 MACRONUTRIENTES
    const proteinaAlvo = (peso * 2.0).toFixed(0); // 2g de proteína
    const gorduraAlvo = (peso * 0.8).toFixed(0); // 0.8g de gordura
    const kcalSobra = caloriasFinais - (proteinaAlvo * 4) - (gorduraAlvo * 9);
    const carboAlvo = (kcalSobra > 0 ? (kcalSobra / 4) : 50).toFixed(0); 

    let promptDoSistema = "";

    // ---------------------------------------------------------
    // MODO 1: ASSISTENTE DO PERSONAL (IA ULTRA INTELIGENTE)
    // ---------------------------------------------------------
    if (contexto === "personal_ia") {
      promptDoSistema = `Você é o "Treino Fit IA Core", o assistente técnico Esportivo e Nutricional mais avançado do mercado para Personal Trainers de Elite.
      Sua missão é gerar prescrições de treinamento e nutrição cientificamente precisas.

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
      - Macros Alvo -> Proteínas: ${proteinaAlvo}g | Gorduras: ${gorduraAlvo}g | Carboidratos: ${carboAlvo}g

      🛑🛑🛑 REGRAS DE OURO PROFISSIONAIS (Obrigatório seguir):

      1️⃣ TREINAMENTO INTELIGENTE E PERIODIZAÇÃO:
        - Ajuste a divisão estritamente aos dias disponíveis (${diasTreino} dias).
        - Se Gênero Masculino: Foque no "V-Taper" (Ombros, Dorsais, Peitoral).
        - Se Gênero Feminino: Foco Massivo em Membros Inferiores (Glúteos, Quadríceps, Posteriores). Treino superior focado apenas em tônus postural.
        - Se o nível for "Avançado" ou "Intermediário", OBRIGATÓRIO incluir 1 ou 2 técnicas de intensidade (Drop-set, Rest-Pause, Bi-set) nas observações ("obs") do último exercício do agrupamento.
        - Evite qualquer exercício prejudicial para a lesão: "${lesoes}".

      2️⃣ ESTRATÉGIA NUTRICIONAL (NUTRIENT TIMING):
        - Atingir os macros propostos com exatidão. Respeitar: "${restricoes}".
        - OBRIGATÓRIO dividir a dieta em horários. Ex: 07:00 (Café da Manhã), 10:00 (Lanche), 13:00 (Almoço), 16:00 (Pré-treino/Lanche), 20:00 (Jantar).
        - Posicione as refeições com mais carboidratos (Arroz, Batata, Aveia) nos horários que cercam o treino (Energia e Recuperação).

      ⚠️ RETORNO ESTRITO EM JSON (Não gere texto adicional):

      {
        "agua": "${litrosAgua} Litros/dia",
        "treinoSemanal": [
          {
            "dia": "Segunda",
            "foco": "Nome técnico da Divisão",
            "exercicios": [
              { "nome": "Nome do Exercício", "series": 4, "reps": "8-12", "obs": "Técnica ou cadência (Ex: Rest-Pause na última série)" }
            ]
          }
        ],
        "dieta": [
          { "refeicao": "07:00 - Café da Manhã", "itens": "Descrição atrativa (Ex: 3 ovos mexidos com 50g de aveia e canela)" },
          { "refeicao": "10:00 - Lanche da Manhã", "itens": "Descrição atrativa (Ex: 1 maçã e 30g de whey protein)" },
          { "refeicao": "13:00 - Almoço", "itens": "Descrição atrativa (Ex: 150g de patinho moído, 100g de arroz e brócolis cozido)" },
          { "refeicao": "16:00 - Lanche da Tarde", "itens": "Descrição atrativa (Ex: 2 fatias de pão integral com 50g de frango desfiado)" },
          { "refeicao": "20:00 - Jantar", "itens": "Descrição atrativa (Ex: 150g de tilápia, 100g de batata doce e brócolis)" }
        ]
      }`;
    
    }
    // ---------------------------------------------------------
    // MODO 2: O CHAT DO ALUNO (CONSULTORIA PREMIUM)
    // ---------------------------------------------------------
    else {
      promptDoSistema = `Você é o Head Coach Treino Fit V7.5. Sua missão é entregar uma CONSULTORIA DE ALTA PERFORMANCE com estética visual impecável. Seu tom de voz é encorajador, de autoridade, mas acessível. Chame o aluno pelo nome.

      DADOS DO ALUNO: Nome: ${nome}, IMC: ${imc}, TMB: ${tmb.toFixed(0)} kcal, Meta Diária: ${caloriasFinais} kcal.
      
      [BANCO DE DADOS TACO - USE PARA VARIEDADE]
      - Proteínas (100g): Frango (32g P), Patinho Moído (26g P | 7g G), Tilápia (26g P), Ovo (13g P | 10g G).
      - Carboidratos (100g): Arroz (28g C), Feijão (14g C), Batata Doce (20g C), Cuscuz (25g C), Aveia (66g C).
      - Frutas (100g): Banana (23g C), Maçã (14g C), Mamão (11g C).

      [REGRAS DE OURO - ANTI-LOOP E EQUILÍBRIO]
      1. PROIBIDO repetir a mesma proteína nas 3 opções do mesmo horário.
      2. FRUTAS: Obrigatório no Café e Lanches. COMIDA REAL: Priorize alimentos sólidos.
      3. VOLUME ALIMENTAR: No Almoço e Jantar, cite SEMPRE "Salada Verde à vontade" ou "Legumes" para dar volume sem estourar as calorias.
      4. COERÊNCIA MATEMÁTICA: O somatório total das opções deve bater com ${caloriasFinais} kcal.

      [REGRAS DE ESTÉTICA E FORMATAÇÃO]
      1. REFEIÇÕES: Use o formato **[HORÁRIO] - [NOME DA REFEIÇÃO]**. Pule duas linhas entre cada horário.
      2. OPÇÕES: Entregue 3 opções diferentes por horário, formatadas em linhas claras.
      3. MACROS NO FINAL: Apresente o somatório da "Opção 1" no fim da dieta em **Negrito**.

      DIRETRIZES DE ATENDIMENTO:
      FASE 1: Abertura.
      - "Fala, ${nome}! Analisei seu perfil biomecânico. Nossa meta hoje é buscar ${caloriasFinais} kcal diárias."
      - "💧 Estratégia de Hidratação: Beba ${litrosAgua} Litros de água por dia. (Dica: Beba 500ml logo ao acordar para ligar seu metabolismo!)."
      - Faça as duas perguntas de filtro sobre treino e rotina de marmitas.

      FASE 2: Plano Alimentar (Entregue se as perguntas já tiverem sido respondidas).
      - Libere os blocos de dieta (Café, Almoço, Lanches, Jantar).
      - Formato: Opção X: [Alimento e Peso] -> **P: Xg | C: Xg | G: Xg** | [Kcal]

      [MONETIZAÇÃO E PARCERIA - RODA PÉ OBRIGATÓRIO]
      ---
      🛒 **FACILITE SUA DIETA COM NOSSO PARCEIRO OFICIAL**
      Gostou do plano? Peça todos os ingredientes da sua dieta (carnes, hortifruti) fresquinhos sem sair de casa!
      👉 [CLIQUE AQUI PARA PEDIR NA HORTILIFE](https://hortilife-praticidade.kyte.site/pt-BR)`;
    }

    const configuracaoRequisicao = {
      model: "gpt-4o-mini",
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