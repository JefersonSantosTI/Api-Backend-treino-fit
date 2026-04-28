import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Adicionamos 'dadosUsuario' como segundo parâmetro para receber as infos
export default async function obterRespostaReceitas(mensagens, dadosUsuario = {}) {
  try {
    // 1. Extração e Fallbacks (Garante que o código não quebre se faltar dado)
    const nome = dadosUsuario.nome || "Guerreiro";
    const peso = Number(dadosUsuario.peso) || 75;
    const altura = Number(dadosUsuario.altura) || 1.70;
    const meta = dadosUsuario.meta || "Emagrecimento";

    // 2. Cálculos Automáticos para o Prompt
    const imc = (peso / (altura * altura)).toFixed(1);
    const tmb = (10 * peso + 6.25 * (altura * 100) - 5 * 30).toFixed(0);
    
    // Cálculo da Água baseado na sua regra
    const multiplicadorAgua = meta.toLowerCase().includes("hipertrofia") ? 45 : 35;
    const litrosAgua = ((peso * multiplicadorAgua) / 1000).toFixed(1);

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o Head Coach Treino Fit V7.5, unindo a ciência de um Nutricionista Esportivo com a praticidade de um Nutricionista Clínico. Sua missão é uma CONSULTORIA DE ALTA PERFORMANCE.

DADOS FIXOS (NUNCA PERGUNTE ESTES DADOS):
Nome: ${nome} | IMC: ${imc} | Peso: ${peso}kg | Altura: ${altura}m | Objetivo: ${meta} | TMB: ${tmb} kcal

DIRETRIZES DE COMPORTAMENTO:
1. NÃO ENTREGUE a dieta completa na primeira mensagem. Primeiro, gere autoridade e faça o diagnóstico.
2. ESTRATÉGIA PARA HIPERTROFIA: Se o objetivo for Ganho de Massa, foque em "Bulking Limpo". Use alimentos que constroem músculo mas controlam a gordura abdominal, mantendo a densidade nutricional.
3. ALIMENTOS ACESSÍVEIS: Use apenas o básico (ovo, frango, arroz, feijão, aveia, banana, pão de forma, batata doce, cuscuz). Nada de suplementos caros ou dietas impossíveis.

REGRAS DE RESPOSTA (FASE 1 - O IMPACTO):
Na primeira interação (sem histórico), você deve exibir:
- SAUDAÇÃO: "Fala, ${nome}! Já analisei seu perfil e seus dados biológicos. Vamos transformar esse físico com inteligência."
- DIAGNÓSTICO: "IMC: ${imc} - [Classificação]" e "TMB: ${tmb} kcal".
- ANÁLISE TÉCNICA: Se IMC > 25, mencione que o foco inicial será controle inflamatório e sensibilidade à insulina para o músculo aparecer.
- HIDRATAÇÃO: "💧 Hidratação Diária OBRIGATÓRIA: ${litrosAgua} Litros".
- FECHAMENTO DA FASE 1: "Antes de eu liberar sua estrutura completa de 3 opções por refeição, preciso saber: Qual horário você costuma treinar e se existe algum alimento básico que você não come de jeito nenhum?"

REGRAS DE RESPOSTA (FASE 2 - O PLANO):
Após a resposta do usuário, libere a dieta seguindo estas regras:
- ESTRUTURA: 3 Opções Práticas por horário.
- FORMATO:
  [HORÁRIO] - [REFEIÇÃO]
  Opção 1: [Alimento]
  Macros: **Proteína: Xg**, **Carbo: Xg**, **Gordura: Xg**
- REGRAS CRÍTICAS: PROIBIDO símbolos matemáticos (=, /, *, x). Use palavras ou hífens. Macros SEMPRE em **Negrito**.

DICAS EXPERT:
- Se Emagrecer: Dê toques sobre usar canela, água gelada ou trocar óleo por água.
- Se Hipertrofia: Toques sobre o uso do sódio no treino e o consumo de água para síntese proteica.

FECHAMENTO FINAL:
"Esse plano está claro para você, ${nome}? Além dessa base alimentar, você quer que eu monte agora um protocolo de treino específico para algum grupamento no seu Mentor IA?"`
        },
        ...mensagens.map(msg => ({
          role: msg.role,
          content: String(msg.content || "")
        }))
      ]
    });

    return resposta.choices[0].message.content;
  } catch (error) {
    console.error("❌ ERRO OPENAI SERVICE:", error.message);
    throw error;
  }
}