import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Adicionamos 'dadosUsuario' como segundo parâmetro para receber as infos
export default async function obterRespostaReceitas(mensagens, dadosUsuario = {}) {
  try {
    const { nome = "Guerreiro", peso = 70, altura = 1.70, meta = "Emagrecimento", idade = 25 } = dadosUsuario;

    const numPeso = Number(peso);
    const numAltura = Number(altura);
    const numIdade = Number(idade);

    // 1. CÁLCULO DE TMB (Mifflin-St Jeor)
    const tmbBase = (10 * numPeso) + (6.25 * (numAltura * 100)) - (5 * numIdade) + 5;

    // 2. DEFINIÇÃO DE CALORIAS
    const fatorAtividade = meta.toLowerCase().includes("hipertrofia") ? 1.55 : 1.2;
    const get = tmbBase * fatorAtividade;
    
    // AQUI ESTAVA O ERRO: Certifique-se de que 'caloriasFinais' está definida
    const caloriasFinais = meta.toLowerCase().includes("hipertrofia") 
      ? (get + 500).toFixed(0) 
      : (get - 500).toFixed(0);

    const litrosAgua = ((numPeso * (meta.toLowerCase().includes("hipertrofia") ? 45 : 35)) / 1000).toFixed(1);

    // 3. PROMPT DO SISTEMA (Injetando os dados calculados)
    const promptSistema = {
        role: "system",
        content: `Você é o Head Coach Treino Fit.
        Dados do Aluno: ${nome}, ${numPeso}kg, ${numAltura}m, ${numIdade} anos.
        Meta: ${meta}.
        Calorias Alvo: ${caloriasFinais} kcal/dia.
        Hidratação Alvo: ${litrosAgua}L/dia.
        [REGRA CRÍTICA]: Dê 3 opções de refeições por horário. Use negrito nos horários. Pule duas linhas entre refeições.`
    };

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o Head Coach Treino Fit V7.5, unindo a ciência de um Nutricionista Esportivo com a praticidade de um Nutricionista Clínico. Sua missão é uma CONSULTORIA DE ALTA PERFORMANCE.

DADOS BIOMÉTRICOS TÉCNICOS:
Atleta: ${nome} | Idade: ${numIdade} anos
Meta: ${meta}
IMC: ${imc}
GET (Gasto Energético Alvo): ${caloriasFinais} kcal/dia
Hidratação OBRIGATÓRIA: ${litrosAgua} Litros/dia

DIRETRIZES DE COMPORTAMENTO:
PROTOCOLO DE ATENDIMENTO:
1. NA PRIMEIRA MENSAGEM: Não dê a dieta. Dê o diagnóstico. Ex: "Pela sua idade de ${numIdade} anos e meta de ${meta}, seu gasto total é de ${caloriasFinais} kcal. Para o seu peso, a hidratação de ${litrosAgua}L é inegociável."
2. EXPLICAÇÃO TÉCNICA: Se for Hipertrofia, explique que as calorias estão em superávit para construir tecido muscular. Se Emagrecimento, explique o déficit para oxidação de gordura.
3. ALIMENTAÇÃO: Use 3 opções por refeição com ALIMENTOS REAIS (arroz, feijão, ovo, frango). 
4. REGRAS CRÍTICAS: Pule DUAS LINHAS entre refeições. Horários em **Negrito**. PROIBIDO símbolos matemáticos.
5. ESTRATÉGIA PARA HIPERTROFIA: Se o objetivo for Ganho de Massa, foque em "Bulking Limpo". Use alimentos que constroem músculo mas controlam a gordura abdominal, mantendo a densidade nutricional.
6. ALIMENTOS ACESSÍVEIS: Use apenas o básico (ovo, frango, arroz, feijão, aveia, banana, pão de forma, batata doce, cuscuz). Nada de suplementos caros ou dietas impossíveis.

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