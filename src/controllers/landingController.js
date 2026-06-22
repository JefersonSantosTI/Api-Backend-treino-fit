import path from 'path';
import { fileURLToPath } from 'url';

// Configuração necessária para o caminho dos arquivos funcionar com "import"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Renderiza a nova página de apresentação (Home/Landing Page)
export const renderHome = (req, res) => {
    try {
        // Encontra o arquivo HTML na pasta views e envia para o usuário
        return res.sendFile(path.join(__dirname, '../views/landing.html'));
    } catch (error) {
        console.error("Erro ao carregar a página inicial:", error);
        return res.status(500).send("Erro interno ao carregar a página.");
    }
};

// Redireciona ou inicia o fluxo de login via WhatsApp
export const handleWhatsAppAuth = (req, res) => {
    // Redireciona para a rota de triagem que você já tem ou vai criar
    return res.redirect('/triagem');
};