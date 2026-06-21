import cron from 'node-cron';
import Aluno from '../controllers/Aluno.js'; 

const dispararMensagemWhatsApp = async (numero, texto) => {
  try {
    // ⚠️ SUA LÓGICA DE WHATSAPP AQUI
    // Exemplo: await fetch('URL_DA_API...', { ... })
    console.log(`📡 [WhatsApp] Enviando para ${numero}: \n${texto}\n`);
  } catch (err) {
    console.error(`❌ Erro WhatsApp ${numero}:`, err.message);
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
  const horaAtual = new Date().getHours(); 
  console.log(`💧 [Cron] Varredura de hidratação das ${horaAtual}h iniciada...`);
  
  try {
    const alunos = await Aluno.find({ 
      statusConta: 'Ativo',
      'lembreteAgua.ativo': true 
    });

    for (const aluno of alunos) {
      const { horaInicio, horaFim, intervaloHoras } = aluno.lembreteAgua;

      if (horaAtual >= horaInicio && horaAtual <= horaFim) {
        if ((horaAtual - horaInicio) % intervaloHoras === 0) {
          
          const numeroLimpo = aluno.whatsapp.replace(/\D/g, "");
          const metaTotalMl = extrairMlDaMeta(aluno.metaAgua);
          
          const totalDisparosNoDia = Math.floor((horaFim - horaInicio) / intervaloHoras) + 1;
          const quantidadePorCopo = Math.round(metaTotalMl / totalDisparosNoDia);

          const mensagem = `Fala, *${aluno.nome.split(' ')[0]}*! Passando para blindar sua hidratação. 💧\n\nSua meta diária é *${metaTotalMl}ml*. Beba agora exatamente *${quantidadePorCopo}ml* de água para manter seu corpo operando em alta performance e não falhar na missão até as ${horaFim}h! 🚀`;

          await dispararMensagemWhatsApp(numeroLimpo, mensagem);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro na varredura do Cron de água:', error.message);
  }
};

// 🚨 MODO TURBO ATIVADO PARA TESTE: Roda a cada 1 MINUTO!
cron.schedule('* * * * *', () => {
  processarLembretesDeAgua();
});

export { processarLembretesDeAgua };