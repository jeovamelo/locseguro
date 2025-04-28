// Atualização do arquivo api.js para garantir ativação automática do modo offline

// URL base da API
const API_URL = 'http://3000-ijxwfwvnyu523t66vmw52-13f789e2.manus.computer/api';

// Verificar disponibilidade do backend
async function verificarBackend() {
    try {
        const response = await fetch(`${API_URL}/status`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // Timeout curto para não bloquear a interface
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch (error) {
        console.warn('Backend indisponível:', error);
        return false;
    }
}

// Funções de autenticação
window.api = {
    // Verificar e ativar modo de demonstração se necessário
    inicializar: async function() {
        try {
            const backendDisponivel = await verificarBackend();
            
            if (!backendDisponivel) {
                console.log('Backend indisponível, ativando modo de demonstração');
                if (window.demoApi) {
                    window.demoApi.ativar();
                    // Mostrar notificação ao usuário
                    this.mostrarNotificacaoModoDemo();
                    return true;
                }
            } else {
                console.log('Backend disponível, modo normal ativado');
                if (window.demoApi && window.demoApi.isActive) {
                    window.demoApi.desativar();
                }
            }
            return backendDisponivel;
        } catch (error) {
            console.error('Erro ao verificar backend:', error);
            // Em caso de erro, ativar modo de demonstração por segurança
            if (window.demoApi) {
                window.demoApi.ativar();
                this.mostrarNotificacaoModoDemo();
                return true;
            }
            return false;
        }
    },
    
    // Mostrar notificação de modo de demonstração
    mostrarNotificacaoModoDemo: function() {
        // Remover notificação existente, se houver
        const notificacaoExistente = document.querySelector('.demo-mode-notification');
        if (notificacaoExistente) {
            notificacaoExistente.remove();
        }
        
        // Criar nova notificação
        const notificacao = document.createElement('div');
        notificacao.className = 'demo-mode-notification';
        notificacao.innerHTML = `
            <div class="demo-mode-content">
                <strong>Modo de Demonstração Ativado</strong>
                <p>O servidor está temporariamente indisponível. O sistema está funcionando em modo de demonstração com dados fictícios.</p>
                <p>Você pode usar as contas de teste listadas abaixo do formulário de login.</p>
                <button id="demo-mode-close">Entendi</button>
            </div>
        `;
        document.body.appendChild(notificacao);
        
        // Adicionar evento para fechar notificação
        document.getElementById('demo-mode-close').addEventListener('click', function() {
            notificacao.style.display = 'none';
        });
    },
    
    auth: {
        // Registrar novo usuário
        registrar: async function(email, senha, tipo) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    console.log('Registrando usuário no modo demo');
                    return await window.demoApi.auth.registrar(email, senha, tipo);
                }
                
                const response = await fetch(`${API_URL}/auth/registrar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha, tipo })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao registrar usuário');
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Erro ao registrar usuário');
                }
                
                return data;
            } catch (error) {
                console.error('Erro ao registrar usuário:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    // Ativar modo de demonstração
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    
                    // Tentar novamente com o modo de demonstração
                    return await window.demoApi.auth.registrar(email, senha, tipo);
                }
                
                throw error;
            }
        },
        
        // Login de usuário
        login: async function(email, senha) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    console.log('Fazendo login no modo demo');
                    return await window.demoApi.auth.login(email, senha);
                }
                
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao fazer login');
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Erro ao fazer login');
                }
                
                return data;
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    console.log('Erro de conexão, ativando modo demo e tentando login novamente');
                    // Ativar modo de demonstração
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    
                    // Tentar novamente com o modo de demonstração
                    return await window.demoApi.auth.login(email, senha);
                }
                
                throw error;
            }
        },
        
        // Verificar status do cadastro
        verificarStatus: async function(token) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    // Implementar quando necessário
                    return { success: true, data: { cadastro_completo: true } };
                }
                
                const response = await fetch(`${API_URL}/auth/status`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao verificar status');
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Erro ao verificar status');
                }
                
                return data;
            } catch (error) {
                console.error('Erro ao verificar status:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    // Implementar quando necessário
                    return { success: true, data: { cadastro_completo: true } };
                }
                
                throw error;
            }
        },
        
        // Completar cadastro de locadora
        completarCadastroLocadora: async function(formData, token) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.auth.completarCadastroLocadora(formData, token);
                }
                
                const response = await fetch(`${API_URL}/auth/completar-cadastro/locadora`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao completar cadastro');
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Erro ao completar cadastro');
                }
                
                return data;
            } catch (error) {
                console.error('Erro ao completar cadastro de locadora:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.auth.completarCadastroLocadora(formData, token);
                }
                
                throw error;
            }
        },
        
        // Completar cadastro de locatário
        completarCadastroLocatario: async function(formData, token) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.auth.completarCadastroLocatario(formData, token);
                }
                
                const response = await fetch(`${API_URL}/auth/completar-cadastro/locatario`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao completar cadastro');
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Erro ao completar cadastro');
                }
                
                return data;
            } catch (error) {
                console.error('Erro ao completar cadastro de locatário:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.auth.completarCadastroLocatario(formData, token);
                }
                
                throw error;
            }
        },
        
        // Verificar autenticação e redirecionar se necessário
        verificarAutenticacao: function() {
            const token = localStorage.getItem('token');
            const usuarioString = localStorage.getItem('usuario');
            
            if (!token || !usuarioString) {
                window.location.href = 'login.html';
                return false;
            }
            
            const usuario = JSON.parse(usuarioString);
            
            // Verificar se o cadastro está completo
            if (!usuario.cadastro_completo) {
                if (usuario.tipo === 'locadora') {
                    window.location.href = 'completar-cadastro-locadora.html';
                } else {
                    window.location.href = 'completar-cadastro-locatario.html';
                }
                return false;
            }
            
            return usuario;
        },
        
        // Verificar permissões de acesso
        verificarPermissao: function(tipoUsuarioPermitido) {
            const usuario = this.verificarAutenticacao();
            
            if (!usuario) {
                return false;
            }
            
            if (Array.isArray(tipoUsuarioPermitido)) {
                if (!tipoUsuarioPermitido.includes(usuario.tipo)) {
                    window.location.href = 'acesso-negado.html';
                    return false;
                }
            } else {
                if (usuario.tipo !== tipoUsuarioPermitido) {
                    window.location.href = 'acesso-negado.html';
                    return false;
                }
            }
            
            return usuario;
        },
        
        // Verificar permissão para funcionalidade específica
        verificarPermissaoFuncionalidade: function(funcionalidade) {
            const usuario = this.verificarAutenticacao();
            
            if (!usuario) {
                return false;
            }
            
            let permitido = false;
            
            if (usuario.tipo === 'locadora') {
                // Permissões para locadoras
                const permissoesLocadora = [
                    'cadastro-carro',
                    'cadastro-locacao',
                    'avaliacoes',
                    'consulta-publica',
                    'perfil',
                    'dashboard'
                ];
                
                permitido = permissoesLocadora.includes(funcionalidade);
            } else {
                // Permissões para locatários
                const permissoesLocatario = [
                    'pesquisar-carros',
                    'minhas-locacoes',
                    'avaliacoes',
                    'consulta-publica',
                    'perfil',
                    'dashboard'
                ];
                
                permitido = permissoesLocatario.includes(funcionalidade);
            }
            
            if (!permitido) {
                window.location.href = 'acesso-negado.html';
                return false;
            }
            
            return usuario;
        },
        
        // Logout
        logout: function() {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
        },
        
        // Redirecionar após login se necessário
        redirecionarAposLogin: function() {
            const redirectUrl = localStorage.getItem('redirect_after_login');
            
            if (redirectUrl) {
                localStorage.removeItem('redirect_after_login');
                window.location.href = redirectUrl;
            } else {
                window.location.href = 'dashboard.html';
            }
        }
    }
};

// Inicializar API quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando API e verificando disponibilidade do backend...');
    await window.api.inicializar();
});
