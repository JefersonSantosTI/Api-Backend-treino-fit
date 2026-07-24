import cron from 'node-cron';
import Aluno from '../controllers/Aluno.js'; 
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BH1RQXRkaFukYxIKfMfqqN1MEh_ruMEMk1toExeB_3K2nrVHzS_Px5WNtoPto0i5LosEdNNQ_MTV6amGefJyoXc';
const VAPID_PRIVATE_KEY = 'lbC3MPr_a1RK0RkxC0ZSxc-OYsx4qtdksO-Hw2DlCO0';

// ✅ CORREÇÃO DE SEGURANÇA
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
    console.log(`===🔔 [Push] Enviado com sucesso para o celular!===`);
  } catch (err) {
    console.error(`❌ Erro físico no envio do Push:`, err.message);
  }
};

const extrairMlDaMeta = (metaStr) => {
  if (!metaStr || metaStr === "Não calculada") return 3500; 
  const limpo = metaStr.replace(',', '.');
  const numero = parseFloat(limpo.match(/[\d.]+/g));
  if (!numero) return 3500;
  return numero < 100 ? Math.round(numero * 1000) : Math.round(numero);
};

const processarLembretesDeAgua = async () => {
  const now = new Date();
  const utcHora = now.getUTCHours();
  const horaAtual = (utcHora - 3 + 24) % 24; 
  const minutoAtual = now.getMinutes();
  
  // 🚨 MODO TESTE: A trava do minuto zero foi DESATIVADA (Comentada)
  // if (minutoAtual !== 0) return;

  console.log(`⏳ [TESTE] Verificando disparos... Hora atual: ${horaAtual}:${minutoAtual}h`);
  
  try {
    const alunos = await Aluno.find({ 
      statusConta: 'Ativo',
      'lembreteAgua.ativo': true 
    });

    if (alunos.length === 0) {
        console.log(`⚠️ Nenhum aluno com lembrete de água ativo no banco de dados.`);
    }

    for (const aluno of alunos) {
      const { horaInicio, horaFim, intervaloHoras, pushSubscription } = aluno.lembreteAgua;
      
      if (!pushSubscription) {
          console.log(`⚠️ Aluno ${aluno.nome} tem lembrete ativo, mas NÃO TEM assinatura do celular salva.`);
          continue;
      }

      const hStart = Number(horaInicio);
      const hEnd = Number(horaFim);
      const interval = Number(intervaloHoras);

      // 🚨 MODO TESTE: As validações de horário foram DESATIVADAS para forçar o envio imediato!
      // if (horaAtual >= hStart && horaAtual <= hEnd) {
      //   const resto = (horaAtual - hStart) % interval;
      //   if (resto === 0) {
          
          console.log(`🔥 [TESTE] Forçando disparo para o aluno: ${aluno.nome}`);

          const metaTotalMl = extrairMlDaMeta(aluno.metaAgua);
          const horasAcordado = hEnd - hStart;
          const totalDisparosNoDia = Math.floor(horasAcordado / interval) + 1;
          const quantidadePorCopo = Math.round(metaTotalMl / totalDisparosNoDia);

          const primeiroNome = aluno.nome.split(' ')[0];
          const mensagem = `Fala ${primeiroNome}, hora de mandar ${quantidadePorCopo}ml de água para dentro! Teste finalizando. 🚀`;

          await dispararPushNotification(pushSubscription, mensagem);

      //   }
      // }
    }
  } catch (error) {
    console.error('❌ Erro Crítico no processamento de água:', error.message);
  }
};

// 🚨 MODO TESTE: Rodando a cada 1 minuto exato para você testar
cron.schedule('* * * * *', () => { 
  processarLembretesDeAgua();
});

export { processarLembretesDeAgua };