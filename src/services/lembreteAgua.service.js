import cron from 'node-cron';
import Aluno from '../controllers/Aluno.js'; 
import webpush from 'web-push';

// Configuração Gratuita do Web Push
const VAPID_PUBLIC_KEY = 'BH1RQXRkaFukYxIKfMfqqN1MEh_ruMEMk1toExeB_3K2nrVHzS_Px5WNtoPto0i5LosEdNNQ_MTV6amGefJyoXc';
const VAPID_PRIVATE_KEY = 'lbC3MPr_a1RK0RkxC0ZSxc-OYsx4qtdksO-Hw2DlCO0';

webpush.setVapidDetails(
  'mailto:contato@seusite.com', // Coloque um email seu
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// NOVA LÓGICA DE DISPARO: AGORA É PUSH!
const dispararPushNotification = async (assinatura, texto) => {
  try {
    const payload = JSON.stringify({
      title: "💧 Hora da Hidratação!",
      body: texto,
      icon: "/logo192.png" // O ícone do Treino Fit que vai aparecer
    });

    await webpush.sendNotification(assinatura, payload);
    console.log(`🔔 [Push] Sucesso! Notificação enviada para o aluno.`);
  } catch (err) {
    console.error(`❌ Erro no Push:`, err.message);
  }
};

const extrairMlDaMeta = (metaStr) => {
  if (!metaStr || metaStr === "Não calculada") return 2000;
  const numeros = metaStr.match(/\d+/g);
  if (!numeros) return 2000;
  const valorMl = Math.max(...numeros.map(Number));
  return valorMl < 100 ? valorMl * 1000 : valorMl; 
};

const processarLembretesDeAgua = async () => {
  // ✅ AJUSTE: Forçando o horário para o Fuso de Brasília (UTC-3)
  const now = new Date();
  const utcHora = now.getUTCHours();
  const horaAtual = (utcHora - 3 + 24) % 24; 
  
  console.log(`⏳ [DEBUG] Hora real (Brasil): ${horaAtual}h`);
  
  try {
    const alunos = await Aluno.find({ 
      statusConta: 'Ativo',
      'lembreteAgua.ativo': true 
    });

    for (const aluno of alunos) {
      const { horaInicio, horaFim, intervaloHoras, pushSubscription } = aluno.lembreteAgua;

      // Se o aluno não ativou a notificação no navegador (não tem assinatura), pula ele
      if (!pushSubscription) continue;

      // Verifica se a hora atual está dentro do intervalo configurado
      if (horaAtual >= horaInicio && horaAtual <= horaFim) {
        
        // Verifica se a hora atual bate com o intervalo escolhido
        if ((horaAtual - horaInicio) % intervaloHoras === 0) {
          
          const metaTotalMl = extrairMlDaMeta(aluno.metaAgua);
          const totalDisparosNoDia = Math.floor((horaFim - horaInicio) / intervaloHoras) + 1;
          const quantidadePorCopo = Math.round(metaTotalMl / totalDisparosNoDia);

          const mensagem = `${aluno.nome.split(' ')[0]}, beba ${quantidadePorCopo}ml de água agora para manter seu corpo em alta performance! 🚀`;

          await dispararPushNotification(pushSubscription, mensagem);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro no Cron de água:', error.message);
  }
};

// 🚨 MODO TURBO ATIVADO PARA TESTE
cron.schedule('* * * * *', () => { 
  processarLembretesDeAgua();
});