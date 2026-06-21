import cron from 'node-cron';
import Aluno from '../controllers/Aluno.js'; 

const dispararMensagemWhatsApp = async (numero, texto) => {
  try {
    // ⚠️ SUA LÓGICA DE WHATSAPP AQUI
    console.log(`📡 [WhatsApp] Enviando para ${numero}: ${texto}`);
  } catch (err) {
    console.error(`❌ Erro WhatsApp ${numero}:`, err.message);
  }
};

// Função para extrair apenas os números (em ML) da meta da IA
// Função para extrair apenas os números (em ML) da meta da IA
const extrairMlDaMeta = (metaStr) => {
  if (!metaStr || metaStr === "Não calculada") return 2000; // Padrão 2L (2000ml)
  
  const numeros = metaStr.match(/\d+/g);
  if (!numeros) return 2000;
  
  // Pega o maior número encontrado na string. Se for "2800ml", ele pega o 2800 perfeitamente.
  const valorMl = Math.max(...numeros.map(Number));
  
  // Proteção: Se por acaso estiver "3 Litros", ele converte pra 3000
  return valorMl < 100 ? valorMl * 1000 : valorMl; 
};

const processarLembretesDeAgua = async () => {
  const horaAtual = new Date().getHours(); // Pega a hora atual (0 a 23)
  console.log(`💧 [Cron] Varredura de hidratação das ${horaAtual}h iniciada...`);
  
  try {
    // Busca apenas alunos ativos E com o lembrete ligado
    const alunos = await Aluno.find({ 
      statusConta: 'Ativo',
      'lembreteAgua.ativo': true 
    });

    for (const aluno of alunos) {
      const { horaInicio, horaFim, intervaloHoras } = aluno.lembreteAgua;

      // 1. Verifica se a hora atual está dentro do limite escolhido pelo aluno
      if (horaAtual >= horaInicio && horaAtual <= horaFim) {
        
        // 2. Verifica se a hora atual bate com o intervalo (Ex: se começou às 8h e o intervalo é 2h, vai rodar 8h, 10h, 12h...)
        if ((horaAtual - horaInicio) % intervaloHoras === 0) {
          
          const numeroLimpo = aluno.whatsapp.replace(/\D/g, "");
          const metaTotalMl = extrairMlDaMeta(aluno.metaAgua);
          
          // 3. O cálculo mágico: Total de ML dividido por quantas vezes o alarme vai tocar no dia
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

// 🎯 CONFIGURAÇÃO: Roda no minuto ZERO de TODAS as horas (ex: 08:00, 09:00, 10:00...)
cron.schedule('0 * * * *', () => {
  processarLembretesDeAgua();
});

export { processarLembretesDeAgua };