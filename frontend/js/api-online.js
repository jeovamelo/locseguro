// API para conexão com o backend real do sistema LOC Seguro

// URL base da API - Configurável para diferentes ambientes
const API_URL = process.env.API_URL || 'https://api-locseguro.herokuapp.com/api';

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

// Funções de autenticação e API
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
                
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha, tipo })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao registrar usuário');
                }
                
                const data = await response.json();
                
                // Armazenar token e dados do usuário
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.user));
                
                return {
                    success: true,
                    data: data
                };
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
                
                return {
                    success: false,
                    error: error.message
                };
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
                    throw new Error(errorData.error || 'Erro ao fazer login');
                }
                
                const data = await response.json();
                
                // Armazenar token e dados do usuário
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.user));
                
                return {
                    success: true,
                    data: data
                };
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
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Completar cadastro de locadora
        completarCadastroLocadora: async function(formData) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.auth.completarCadastroLocadora(formData);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                const response = await fetch(`${API_URL}/locadoras`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao completar cadastro');
                }
                
                const data = await response.json();
                
                // Atualizar dados do usuário
                const usuario = JSON.parse(localStorage.getItem('usuario'));
                usuario.perfil_completo = true;
                localStorage.setItem('usuario', JSON.stringify(usuario));
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao completar cadastro de locadora:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.auth.completarCadastroLocadora(formData);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Completar cadastro de locatário
        completarCadastroLocatario: async function(formData) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.auth.completarCadastroLocatario(formData);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                const response = await fetch(`${API_URL}/locatarios`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao completar cadastro');
                }
                
                const data = await response.json();
                
                // Atualizar dados do usuário
                const usuario = JSON.parse(localStorage.getItem('usuario'));
                usuario.perfil_completo = true;
                localStorage.setItem('usuario', JSON.stringify(usuario));
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao completar cadastro de locatário:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.auth.completarCadastroLocatario(formData);
                }
                
                return {
                    success: false,
                    error: error.message
                };
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
            if (!usuario.perfil_completo) {
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
        
        // Logout
        logout: function() {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
    },
    
    // API para Carros
    carros: {
        // Cadastrar carro
        cadastrar: async function(formData) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.carros.cadastrar(formData);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                const response = await fetch(`${API_URL}/carros`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao cadastrar carro');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao cadastrar carro:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.carros.cadastrar(formData);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Listar carros
        listar: async function(filtros = {}) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.carros.listar(filtros);
                }
                
                // Construir query string
                const queryParams = new URLSearchParams();
                if (filtros.disponivel !== undefined) {
                    queryParams.append('disponivel', filtros.disponivel);
                }
                if (filtros.locadora_id) {
                    queryParams.append('locadora_id', filtros.locadora_id);
                }
                
                const url = `${API_URL}/carros${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
                
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao listar carros');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao listar carros:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.carros.listar(filtros);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Obter detalhes de um carro
        obter: async function(id) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.carros.obter(id);
                }
                
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                const response = await fetch(`${API_URL}/carros/${id}`, {
                    method: 'GET',
                    headers: headers
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao obter carro');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao obter carro:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.carros.obter(id);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    },
    
    // API para Locações
    locacoes: {
        // Cadastrar locação
        cadastrar: async function(formData) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.locacoes.cadastrar(formData);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                const response = await fetch(`${API_URL}/locacoes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao cadastrar locação');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao cadastrar locação:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.locacoes.cadastrar(formData);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Listar locações
        listar: async function(filtros = {}) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.locacoes.listar(filtros);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                // Construir query string
                const queryParams = new URLSearchParams();
                if (filtros.status) {
                    queryParams.append('status', filtros.status);
                }
                if (filtros.locadora_id) {
                    queryParams.append('locadora_id', filtros.locadora_id);
                }
                if (filtros.locatario_id) {
                    queryParams.append('locatario_id', filtros.locatario_id);
                }
                
                const url = `${API_URL}/locacoes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao listar locações');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao listar locações:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.locacoes.listar(filtros);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Obter detalhes de uma locação
        obter: async function(id) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.locacoes.obter(id);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                const response = await fetch(`${API_URL}/locacoes/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao obter locação');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao obter locação:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.locacoes.obter(id);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    },
    
    // API para Avaliações
    avaliacoes: {
        // Cadastrar avaliação de locadora
        avaliarLocadora: async function(formData) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.avaliacoes.avaliarLocadora(formData);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                const response = await fetch(`${API_URL}/avaliacoes/locatario`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao cadastrar avaliação');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao avaliar locadora:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.avaliacoes.avaliarLocadora(formData);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Cadastrar avaliação de locatário
        avaliarLocatario: async function(formData) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.avaliacoes.avaliarLocatario(formData);
                }
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Usuário não autenticado');
                }
                
                const response = await fetch(`${API_URL}/avaliacoes/locadora`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao cadastrar avaliação');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao avaliar locatário:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.avaliacoes.avaliarLocatario(formData);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Listar avaliações de locadora
        listarAvaliacoesLocadora: async function(locadora_id) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.avaliacoes.listarAvaliacoesLocadora(locadora_id);
                }
                
                const response = await fetch(`${API_URL}/avaliacoes/locadora?locadora_id=${locadora_id}`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao listar avaliações');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao listar avaliações de locadora:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.avaliacoes.listarAvaliacoesLocadora(locadora_id);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Listar avaliações de locatário
        listarAvaliacoesLocatario: async function(locatario_id) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.avaliacoes.listarAvaliacoesLocatario(locatario_id);
                }
                
                const response = await fetch(`${API_URL}/avaliacoes/locatario?locatario_id=${locatario_id}`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao listar avaliações');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao listar avaliações de locatário:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.avaliacoes.listarAvaliacoesLocatario(locatario_id);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    },
    
    // API para Consulta Pública
    consulta: {
        // Consultar locadora
        consultarLocadora: async function(id) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.consulta.consultarLocadora(id);
                }
                
                const response = await fetch(`${API_URL}/consulta/locadora/${id}`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao consultar locadora');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao consultar locadora:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.consulta.consultarLocadora(id);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        // Consultar locatário
        consultarLocatario: async function(id) {
            try {
                // Verificar se estamos em modo de demonstração
                if (window.demoApi && window.demoApi.isActive) {
                    return await window.demoApi.consulta.consultarLocatario(id);
                }
                
                const response = await fetch(`${API_URL}/consulta/locatario/${id}`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao consultar locatário');
                }
                
                const data = await response.json();
                
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Erro ao consultar locatário:', error);
                
                // Se o erro for de conexão e temos modo de demonstração disponível
                if ((error.message === 'Failed to fetch' || error.name === 'TypeError' || error.name === 'AbortError') && window.demoApi) {
                    window.demoApi.ativar();
                    window.api.mostrarNotificacaoModoDemo();
                    return await window.demoApi.consulta.consultarLocatario(id);
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }
};

// Inicializar API ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    await window.api.inicializar();
});
