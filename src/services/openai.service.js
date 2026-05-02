import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function obterRespostaReceitas(mensagens, dadosUsuario = {}) {
  try {
    // 1. EXTRAÇÃO E CONVERSÃO
    const peso = Number(dadosUsuario.peso || 70);
    const altura = Number(dadosUsuario.altura || 1.70);
    const idade = Number(dadosUsuario.idade || 25);
    const nome = dadosUsuario.nome || "Guerreiro(a)";
    const meta = dadosUsuario.meta || "Emagrecimento";

    // 2. CÁLCULOS TÉCNICOS (Fator 60ml/kg para precisão profissional)
    const tmb = (10 * peso) + (6.25 * (altura * 100)) - (5 * idade) + 5;
    const imc = (peso / (altura * altura)).toFixed(1);
    
    const multiplicadorAgua = meta.toLowerCase().includes("emagrecimento") ? 60 : 50;
    const litrosAgua = ((peso * multiplicadorAgua) / 1000).toFixed(1);

    const fatorAtividade = meta.toLowerCase().includes("hipertrofia") ? 1.55 : 1.2;
    const get = (tmb * fatorAtividade).toFixed(0);
    const caloriasFinais = meta.toLowerCase().includes("hipertrofia") ? (Number(get) + 500) : (Number(get) - 500);

    // 3. CHAMADA OPENAI - FOCO EM UI/UX E PRECISÃO
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o Head Coach Treino Fit V7.5. Sua missão é entregar uma CONSULTORIA DE ALTA PERFORMANCE com estética visual impecável e precisão matemática.

        DADOS DO ALUNO: Nome: ${nome}, IMC: ${imc}, TMB: ${tmb.toFixed(0)} kcal, Calorias Alvo: ${caloriasFinais} kcal.
        
        [TABELA DE REFERÊNCIA TACO - OBRIGATÓRIA]
        - Frango Grelhado (100g): 32g P | 2.5g G | 0g C.
        - Arroz Integral (100g): 2.6g P | 1.0g G | 25.8g C.
        - Ovo Inteiro (50g): 6.3g P | 4.8g G | 0.5g C.

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

MANDAMENTO: PROIBIDO símbolos matemáticos genéricos. Macros em **Negrito**. Use apenas alimentos acessíveis conforme o prompt original (ovo, frango, arroz, feijão, aveia, banana).`
        },
        ...mensagens.map(msg => ({
          role: msg.role,
          content: String(msg.content || "")
        }))
      ]
    });

    return resposta.choices[0].message.content;

  } catch (err) {
    console.error("❌ ERRO NO SERVIÇO OPENAI:", err.message);
    throw new Error(err.message);
  }
}