import { useState, useEffect } from "react";
import ChatReceitas from "./pages/ChatReceitas";
import Login from "./components/Login";
import TelaPlanos from "./components/TelaPlanos";

function App() {
  const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario_whatsapp"));
  const [isVip, setIsVip] = useState(() => localStorage.getItem("acesso_vip") === "true");
  const [abaAtiva, setAbaAtiva] = useState("home");
  const [bloqueado, setBloqueado] = useState(false);
  const [codigoInput, setCodigoInput] = useState("");

  const [perfil, setPerfil] = useState({
    nome: localStorage.getItem("perfil_nome") || "Guerreiro(a)",
    peso: localStorage.getItem("perfil_peso") || "0",
    altura: localStorage.getItem("perfil_altura") || "0",
    meta: localStorage.getItem("perfil_meta") || "Não definida",
    faltam: localStorage.getItem("perfil_faltam") || "0",
    diasRestantes: localStorage.getItem("perfil_dias") || "0"
  });

  const API_URL = "https://api-backend-treino-fit.onrender.com/api";

  const atualizarEstadoPerfil = () => {
    setIsVip(localStorage.getItem("acesso_vip") === "true");
    setPerfil({
      nome: localStorage.getItem("perfil_nome") || "Guerreiro(a)",
      peso: localStorage.getItem("perfil_peso") || "0",
      altura: localStorage.getItem("perfil_altura") || "0",
      meta: localStorage.getItem("perfil_meta") || "Não definida",
      faltam: localStorage.getItem("perfil_faltam") || "0",
      diasRestantes: localStorage.getItem("perfil_dias") || "0"
    });
  };

  // Sincronização com o Banco de Dados
  useEffect(() => {
    if (usuario) {
      const sincronizarComBanco = async () => {
        try {
          const whatsLimpo = String(usuario).replace(/\D/g, "");
          const response = await fetch(`${API_URL}/usuarios/${whatsLimpo}`);

          if (response.ok) {
            const dados = await response.json();
            if (dados) {
              // Atualiza LocalStorage com dados reais do banco
              localStorage.setItem("perfil_nome", dados.nome || "Guerreiro(a)");
              localStorage.setItem("perfil_peso", dados.peso || "0");
              localStorage.setItem("perfil_altura", dados.altura || "0");
              localStorage.setItem("perfil_meta", dados.meta || "Emagrecimento");
              localStorage.setItem("acesso_vip", dados.pago ? "true" : "false");
              
              // Se o seu banco calcular a diferença de peso, salve aqui:
              // localStorage.setItem("perfil_faltam", dados.faltam || "0");

              atualizarEstadoPerfil();
            }
          }
        } catch (err) {
          console.error("Erro ao sincronizar:", err);
        }
      };
      sincronizarComBanco();
    }
  }, [usuario]);

  // Função para Ativar o Código VIP
  const handleAtivarVip = async () => {
    if (!codigoInput) return alert("Digite um código!");

    try {
      const response = await fetch(`${API_URL}/usuarios/ativar-vip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          whatsapp: usuario, 
          codigo: codigoInput 
        }),
      });

      if (response.ok) {
        alert("💎 VIP ATIVADO COM SUCESSO!");
        localStorage.setItem("acesso_vip", "true");
        setIsVip(true);
        setBloqueado(false);
        setCodigoInput("");
      } else {
        const erro = await response.json();
        alert(erro.mensagem || "Código inválido!");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleLogin = (whatsapp) => {
    const whatsApenasNumeros = String(whatsapp).replace(/\D/g, "");
    localStorage.setItem("usuario_whatsapp", whatsApenasNumeros);
    setUsuario(whatsApenasNumeros);
    setAbaAtiva("home");
  };

  const handleSair = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!usuario) {
    return res.status(404).json({ mensagem: "Usuário não encontrado" });
}

  return (
    <div className="fixed inset-0 bg-gray-950 text-white font-sans overflow-hidden flex flex-col">

      {abaAtiva === "home" && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <header className="w-full max-w-md flex justify-between items-center mt-4 mb-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black">FIT</div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase font-black">Membro Fit</p>
                <h2 className="text-xl font-black uppercase">{perfil.nome}</h2>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-900 px-4 py-2 rounded-2xl border border-gray-800">
                <span className="text-2xl font-black text-emerald-500">{perfil.diasRestantes}</span>
                <span className="text-[9px] text-gray-500 uppercase ml-1">Dias</span>
              </div>
              <button onClick={() => setBloqueado(true)} className={`text-[10px] uppercase font-bold mt-1 ${isVip ? "text-emerald-400" : "text-orange-500"}`}>
                {isVip ? "💎 VIP ATIVO" : "⚡ VIRAR VIP"}
              </button>
            </div>
          </header>

          <main className="w-full max-w-md flex-1 flex flex-col items-center">
            <div className="relative w-60 h-60 mb-8 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="120" cy="120" r="100" stroke="#111827" strokeWidth="10" fill="transparent" />
                <circle cx="120" cy="120" r="100" stroke="#10b981" strokeWidth="12" fill="transparent"
                  strokeDasharray="628" strokeDashoffset={628 - (628 * 0.7)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-gray-500 font-black uppercase">Faltam</p>
                <h3 className="text-5xl font-black">{perfil.faltam}</h3>
                <p className="text-sm font-bold text-emerald-500 uppercase">kg para a Meta</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full mb-8">
              <div className="bg-gray-900/50 p-4 rounded-3xl border border-gray-800 text-center">
                <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Peso</p>
                <p className="text-sm font-bold">{perfil.peso}kg</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-3xl border border-gray-800 text-center">
                <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Altura</p>
                <p className="text-sm font-bold">{perfil.altura}m</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-3xl border border-gray-800 text-center">
                <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Meta</p>
                <p className="text-sm font-bold italic uppercase">{perfil.meta}</p>
              </div>
            </div>

            <button onClick={() => setAbaAtiva("chat")} className="w-full bg-emerald-500 text-black font-black py-5 rounded-[2rem] shadow-xl uppercase text-sm mb-6">
              💬 Abrir Chat Nutri
            </button>

            <button onClick={handleSair} className="text-[10px] text-gray-600 font-black uppercase tracking-widest hover:text-red-500 transition-colors">
              [ Sair do Perfil ]
            </button>
          </main>
        </div>
      )}

      {abaAtiva === "chat" && (
        <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
          <header className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
            <button onClick={() => { setAbaAtiva("home"); atualizarEstadoPerfil(); }} className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase">
              🏠 Voltar
            </button>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Ana Nutri</span>
            <div className="text-[10px] text-emerald-500 font-bold">{isVip ? "💎 VIP" : "FREE"}</div>
          </header>
          <div className="flex-1 relative overflow-hidden">
            <ChatReceitas
              whatsapp={usuario}
              isVip={isVip}
              perfil={perfil}
              aoPedirUpgrade={() => setBloqueado(true)}
              aoAtualizarPerfil={atualizarEstadoPerfil}
            />
          </div>
        </div>
      )}

      {bloqueado && (
        <div className="fixed inset-0 z-[200] bg-gray-950 p-4 overflow-y-auto flex flex-col items-center">
          <TelaPlanos aoEscolher={() => { }} />
          <div className="w-full max-w-xs mt-6">
            <input
              type="text"
              placeholder="CÓDIGO VIP..."
              className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center mb-4 text-white uppercase"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
            />
            <button 
              onClick={handleAtivarVip}
              className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase hover:bg-emerald-400 transition-colors"
            >
              Ativar VIP
            </button>
            <button onClick={() => setBloqueado(false)} className="w-full text-gray-500 text-xs mt-4 uppercase font-bold">Talvez mais tarde</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;