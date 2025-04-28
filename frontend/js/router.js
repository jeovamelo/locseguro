// router.js - Sistema de roteamento para o LOC Seguro

// Configuração de rotas
const routes = {
    '/': 'index.html',
    '/index': 'index.html',
    '/login': 'login.html',
    '/cadastro': 'cadastro.html',
    '/dashboard': 'dashboard.html',
    '/cadastro-locadora': 'cadastro-locadora.html',
    '/cadastro-locatario': 'cadastro-locatario.html',
    '/cadastro-carro': 'cadastro-carro.html',
    '/cadastro-locacao': 'cadastro-locacao.html',
    '/avaliacao': 'avaliacao.html',
    '/consulta-publica': 'consulta-publica.html',
    '/completar-cadastro-locadora': 'completar-cadastro-locadora.html',
    '/completar-cadastro-locatario': 'completar-cadastro-locatario.html',
    '/acesso-negado': 'acesso-negado.html',
    '/erro': 'erro.html'
};

// Função para lidar com navegação
function handleNavigation(event) {
    if (event) {
        event.preventDefault();
    }
    
    let path = window.location.pathname;
    
    // Remover extensão .html se presente na URL
    if (path.endsWith('.html')) {
        path = path.substring(0, path.length - 5);
    }
    
    // Verificar se a rota existe
    if (routes[path]) {
        loadPage(routes[path]);
    } else {
        // Verificar se é uma rota sem a barra inicial
        if (routes['/' + path]) {
            loadPage(routes['/' + path]);
        } else {
            console.error('Rota não encontrada:', path);
            loadPage('erro.html');
        }
    }
}

// Função para carregar página
function loadPage(page) {
    try {
        fetch(page)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar página: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                document.open();
                document.write(html);
                document.close();
                
                // Ativar scripts na nova página
                const scripts = document.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const script = scripts[i];
                    const scriptClone = document.createElement('script');
                    
                    if (script.src) {
                        scriptClone.src = script.src;
                    } else {
                        scriptClone.textContent = script.textContent;
                    }
                    
                    document.body.appendChild(scriptClone);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar página:', error);
                
                // Verificar se é o dashboard e ativar modo de fallback
                if (page === 'dashboard.html') {
                    loadDashboardFallback();
                } else {
                    // Redirecionar para página de erro
                    window.location.href = 'erro.html';
                }
            });
    } catch (error) {
        console.error('Erro ao processar navegação:', error);
        
        // Verificar se é o dashboard e ativar modo de fallback
        if (page === 'dashboard.html') {
            loadDashboardFallback();
        } else {
            // Redirecionar para página de erro
            window.location.href = 'erro.html';
        }
    }
}

// Função para carregar dashboard em modo de fallback
function loadDashboardFallback() {
    console.log('Carregando dashboard em modo de fallback');
    
    // Verificar se o usuário está autenticado
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
        window.location.href = 'login.html?error=session_expired';
        return;
    }
    
    // Carregar dashboard de fallback
    fetch('dashboard-fallback.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar dashboard de fallback: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.open();
            document.write(html);
            document.close();
            
            // Ativar scripts na nova página
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const script = scripts[i];
                const scriptClone = document.createElement('script');
                
                if (script.src) {
                    scriptClone.src = script.src;
                } else {
                    scriptClone.textContent = script.textContent;
                }
                
                document.body.appendChild(scriptClone);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dashboard de fallback:', error);
            
            // Criar dashboard de emergência diretamente no DOM
            document.open();
            document.write(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>LOC Seguro - Dashboard (Modo Emergência)</title>
                    <link rel="stylesheet" href="css/styles.css">
                    <link rel="stylesheet" href="css/demo-mode.css">
                    <style>
                        .emergency-container {
                            max-width: 800px;
                            margin: 50px auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        
                        .emergency-header {
                            background-color: #0056b3;
                            color: white;
                            padding: 15px;
                            border-radius: 8px 8px 0 0;
                            margin: -20px -20px 20px;
                        }
                        
                        .emergency-actions {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                            gap: 15px;
                            margin-top: 20px;
                        }
                        
                        .emergency-card {
                            background-color: white;
                            padding: 15px;
                            border-radius: 8px;
                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                            text-align: center;
                        }
                        
                        .emergency-card i {
                            font-size: 2rem;
                            color: #0056b3;
                            margin-bottom: 10px;
                        }
                        
                        .emergency-notice {
                            background-color: #fff3cd;
                            border: 1px solid #ffeeba;
                            color: #856404;
                            padding: 10px;
                            border-radius: 4px;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <header>
                        <div class="container header-container">
                            <a href="index.html" class="logo">LOC<span>Seguro</span></a>
                            <nav>
                                <ul>
                                    <li><a href="index.html">Início</a></li>
                                    <li><a href="dashboard.html" class="active">Dashboard</a></li>
                                    <li><a href="javascript:void(0);" onclick="logout()">Sair</a></li>
                                </ul>
                            </nav>
                        </div>
                    </header>
                    
                    <main>
                        <div class="container">
                            <div class="emergency-container">
                                <div class="emergency-header">
                                    <h1>Dashboard (Modo Emergência)</h1>
                                </div>
                                
                                <div class="emergency-notice">
                                    <p><strong>Aviso:</strong> O sistema está operando em modo de emergência devido a problemas de conexão. Algumas funcionalidades podem estar limitadas.</p>
                                </div>
                                
                                <div id="user-info">
                                    <h2>Informações do Usuário</h2>
                                    <div id="user-details">
                                        <!-- Será preenchido via JavaScript -->
                                    </div>
                                </div>
                                
                                <div class="emergency-actions" id="emergency-actions">
                                    <!-- Será preenchido via JavaScript -->
                                </div>
                            </div>
                        </div>
                    </main>
                    
                    <footer>
                        <div class="container">
                            <p>&copy; 2025 LOC Seguro - Sistema de Locação de Carros com Avaliação e Multa</p>
                        </div>
                    </footer>
                    
                    <div class="demo-mode-indicator">MODO DEMONSTRAÇÃO</div>
                    
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            // Carregar informações do usuário
                            const usuarioJSON = localStorage.getItem('usuario');
                            if (usuarioJSON) {
                                try {
                                    const usuario = JSON.parse(usuarioJSON);
                                    const userDetails = document.getElementById('user-details');
                                    
                                    if (usuario.tipo === 'locadora') {
                                        userDetails.innerHTML = \`
                                            <p><strong>Tipo:</strong> Locadora</p>
                                            <p><strong>Email:</strong> \${usuario.email || 'Não disponível'}</p>
                                            <p><strong>Nome:</strong> \${usuario.nome_fantasia || 'Não disponível'}</p>
                                        \`;
                                        
                                        // Ações para locadora
                                        document.getElementById('emergency-actions').innerHTML = \`
                                            <div class="emergency-card">
                                                <i class="fas fa-home"></i>
                                                <h3>Página Inicial</h3>
                                                <a href="index.html" class="btn btn-primary">Acessar</a>
                                            </div>
                                            <div class="emergency-card">
                                                <i class="fas fa-car"></i>
                                                <h3>Meus Carros</h3>
                                                <a href="javascript:alert('Funcionalidade limitada no modo de emergência');" class="btn btn-primary">Visualizar</a>
                                            </div>
                                            <div class="emergency-card">
                                                <i class="fas fa-users"></i>
                                                <h3>Meus Clientes</h3>
                                                <a href="javascript:alert('Funcionalidade limitada no modo de emergência');" class="btn btn-primary">Visualizar</a>
                                            </div>
                                            <div class="emergency-card">
                                                <i class="fas fa-file-contract"></i>
                                                <h3>Minhas Locações</h3>
                                                <a href="javascript:alert('Funcionalidade limitada no modo de emergência');" class="btn btn-primary">Visualizar</a>
                                            </div>
                                        \`;
                                    } else {
                                        userDetails.innerHTML = \`
                                            <p><strong>Tipo:</strong> Locatário</p>
                                            <p><strong>Email:</strong> \${usuario.email || 'Não disponível'}</p>
                                            <p><strong>Nome:</strong> \${usuario.nome || 'Não disponível'}</p>
                                        \`;
                                        
                                        // Ações para locatário
                                        document.getElementById('emergency-actions').innerHTML = \`
                                            <div class="emergency-card">
                                                <i class="fas fa-home"></i>
                                                <h3>Página Inicial</h3>
                                                <a href="index.html" class="btn btn-primary">Acessar</a>
                                            </div>
                                            <div class="emergency-card">
                                                <i class="fas fa-search"></i>
                                                <h3>Pesquisar Carros</h3>
                                                <a href="javascript:alert('Funcionalidade limitada no modo de emergência');" class="btn btn-primary">Pesquisar</a>
                                            </div>
                                            <div class="emergency-card">
                                                <i class="fas fa-file-contract"></i>
                                                <h3>Minhas Locações</h3>
                                                <a href="javascript:alert('Funcionalidade limitada no modo de emergência');" class="btn btn-primary">Visualizar</a>
                                            </div>
                                            <div class="emergency-card">
                                                <i class="fas fa-star"></i>
                                                <h3>Minhas Avaliações</h3>
                                                <a href="javascript:alert('Funcionalidade limitada no modo de emergência');" class="btn btn-primary">Visualizar</a>
                                            </div>
                                        \`;
                                    }
                                } catch (error) {
                                    console.error('Erro ao processar informações do usuário:', error);
                                }
                            } else {
                                window.location.href = 'login.html?error=session_expired';
                            }
                        });
                        
                        // Função para logout
                        function logout() {
                            localStorage.removeItem('usuario');
                            localStorage.removeItem('token');
                            window.location.href = 'login.html?logout=success';
                        }
                    </script>
                </body>
                </html>
            `);
            document.close();
        });
}

// Inicializar sistema de roteamento
document.addEventListener('DOMContentLoaded', function() {
    // Interceptar cliques em links
    document.body.addEventListener('click', function(event) {
        // Verificar se o clique foi em um link
        let target = event.target;
        while (target && target !== document) {
            if (target.tagName === 'A' && target.href && target.href.startsWith(window.location.origin)) {
                handleNavigation(event);
                break;
            }
            target = target.parentNode;
        }
    });
    
    // Interceptar eventos de navegação
    window.addEventListener('popstate', handleNavigation);
});

// Exportar funções para uso global
window.router = {
    navigate: function(path) {
        window.history.pushState({}, '', path);
        handleNavigation();
    }
};
