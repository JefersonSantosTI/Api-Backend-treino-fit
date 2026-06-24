import cron from 'node-cron';
import Aluno from '../controllers/Aluno.js'; 
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BH1RQXRkaFukYxIKfMfqqN1MEh_ruMEMk1toExeB_3K2nrVHzS_Px5WNtoPto0i5LosEdNNQ_MTV6amGefJyoXc';
const VAPID_PRIVATE_KEY = 'lbC3MPr_a1RK0RkxC0ZSxc-OYsx4qtdksO-Hw2DlCO0';

// ✅ CORREÇÃO DE SEGURANÇA: Configurando com um e-mail válido para evitar bloqueios
webpush.setVapidDetails(
  'mailto:jeferson@treinofit.app.br', 
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const dispararPushNotification = async (assinatura, texto) => {
  try {
    const payload = JSON.stringify({
      title: "💧 Alerta de Hidratação IA",
      body: texto,
      icon: "/logo192.png"
    });
    await webpush.sendNotification(assinatura, payload);
    console.log(`===🔔 [Push] Enviado com sucesso!===`);
  } catch (err) {
    console.error(`❌ Erro físico no envio do Push:`, err.message);
  }
};

// Transforma "4.2 Litros/dia" ou "4,2" em 4200 pura numeração boba
const extrairMlDaMeta = (metaStr) => {
  if (!metaStr || metaStr === "Não calculada") return 3500; // Padrão de segurança
  // Pega todos os números e pontos/vírgulas
  const limpo = metaStr.replace(',', '.');
  const numero = parseFloat(limpo.match(/[\d.]+/g));
  if (!numero) return 3500;
  
  // Se o usuário digitou em formato de litros (ex: 4.2), multiplica por 1000
  return numero < 100 ? Math.round(numero * 1000) : Math.round(numero);
};

const processarLembretesDeAgua = async () => {
  const now = new Date();
  const utcHora = now.getUTCHours();
  const horaAtual = (utcHora - 3 + 24) % 24; // Horário padrão de Brasília
  const minutoAtual = now.getMinutes();
  
  // ✅ MODO DE PRODUÇÃO ATIVADO: O disparador só roda exato no minuto 00 da hora (ex: 13:00, 14:00)
  if (minutoAtual !== 0) return;

  console.log(`⏳ [PRODUÇÃO] Verificando disparos para a hora cheia: ${horaAtual}:00h`);
  
  try {
    const alunos = await Aluno.find({ 
      statusConta: 'Ativo',
      'lembreteAgua.ativo': true 
    });

    for (const aluno of alunos) {
      const { horaInicio, horaFim, intervaloHoras, pushSubscription, tipoFrequencia } = aluno.lembreteAgua;
      
      if (!pushSubscription) continue;

      const hStart = Number(horaInicio);
      const hEnd = Number(horaFim);
      const interval = Number(intervaloHoras);

      // 1. Validação de Janela de Horário Escolhida pelo Aluno
      if (horaAtual >= hStart && horaAtual <= hEnd) {
        
        // Verifica se a hora atual coincide matematicamente com o intervalo do aluno
        const resto = (horaAtual - hStart) % interval;
        
        if (resto === 0) {
          // 2. MATEMÁTICA DA IA: Descobrir o volume exato por copo
          const metaTotalMl = extrairMlDaMeta(aluno.metaAgua);
          const horasAcordado = hEnd - hStart;
          
          // Total de vezes que o sistema vai apitar para esse aluno no dia
          const totalDisparosNoDia = Math.floor(horasAcordado / interval) + 1;
          
          // ML exato de cada meta fracionada
          const quantidadePorCopo = Math.round(metaTotalMl / totalDisparosNoDia);

          const primeiroNome = aluno.nome.split(' ')[0];
          const mensagem = `Fala ${primeiroNome}, hora de mandar ${quantidadePorCopo}ml de água para dentro! Falta pouco para bater sua meta de ${aluno.metaAgua}. 🚀`;

          // 3. Disparar
          await dispararPushNotification(pushSubscription, mensagem);

          // 4. Regra de finalização caso seja um plano temporário (Diário)
          if (tipoFrequencia === 'Diário' && horaAtual === hEnd) {
             console.log(`✨ [IA] Desativando lembrete Diário concluído para: ${aluno.nome}`);
             aluno.lembreteAgua.ativo = false;
             await aluno.save();
          }
        }
      }
      
      // Limpeza Mensal Automática: Se for dia 1 do mês às 00h, reseta os planos 'Mensal' se necessário
      if (tipoFrequencia === 'Mensal' && now.getDate() === 1 && horaAtual === hStart) {
         // Lógica para controle ou renovação mensal futura aqui se quiser
      }
    }
  } catch (error) {
    console.error('❌ Erro Crítico no processamento de água:', error.message);
  }
};

// ✅ ALTERADO: Agora roda de hora em hora de forma profissional para não estressar o celular
cron.schedule('0 * * * *', () => { 
  processarLembretesDeAgua();
});

export { processarLembretesDeAgua };