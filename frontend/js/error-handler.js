// Tratamento de erro aprimorado para o sistema LOC Seguro
// Este arquivo implementa um sistema robusto para lidar com erros de conexão
// e garantir que o sistema funcione mesmo quando o backend está indisponível

// Configuração global
const CONFIG = {
    BACKEND_URL: 'http://3000-ijxwfwvnyu523t66vmw52-13f789e2.manus.computer',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // ms
    OFFLINE_MODE_ENABLED: true,
    DEBUG: true
};

// Estado global do sistema
let SYSTEM_STATE = {
    isOfflineMode: false,
    connectionAttempts: 0,
    lastConnectionTime: null,
    offlineForms: [], // Armazena formulários preenchidos offline para sincronização posterior
    pendingRequests: [] // Armazena requisições que falharam para tentar novamente
};

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de tratamento de erro robusto...');
    checkBackendConnection();
    setupGlobalErrorHandling();
    setupFormInterception();
    
    // Verificar se estamos em uma página de completar cadastro
    if (window.location.pathname.includes('completar-cadastro')) {
        setupCompletarCadastroFallback();
    }
});

// Verifica a conexão com o backend
async function checkBackendConnection() {
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        if (response.ok) {
            console.log('Backend disponível');
            SYSTEM_STATE.isOfflineMode = false;
            SYSTEM_STATE.lastConnectionTime = Date.now();
            SYSTEM_STATE.connectionAttempts = 0;
            
            // Se estava em modo offline, remover notificação
            removeOfflineNotification();
            
            // Tentar sincronizar dados offline
            syncOfflineData();
            
            return true;
        } else {
            throw new Error('Backend respondeu com erro');
        }
    } catch (error) {
        console.warn('Backend indisponível:', error);
        SYSTEM_STATE.connectionAttempts++;
        
        if (SYSTEM_STATE.connectionAttempts >= CONFIG.RETRY_ATTEMPTS) {
            activateOfflineMode();
        }
        
        return false;
    }
}

// Ativa o modo offline
function activateOfflineMode() {
    if (!SYSTEM_STATE.isOfflineMode && CONFIG.OFFLINE_MODE_ENABLED) {
        console.log('Ativando modo offline');
        SYSTEM_STATE.isOfflineMode = true;
        
        // Mostrar notificação de modo offline
        showOfflineNotification();
        
        // Carregar dados de demonstração
        loadDemoData();
    }
}

// Configura tratamento global de erros
function setupGlobalErrorHandling() {
    // Interceptar erros de fetch
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        try {
            const response = await originalFetch(url, options);
            return response;
        } catch (error) {
            console.error('Erro na requisição fetch:', error);
            
            // Se for uma requisição para o backend
            if (url.toString().includes(CONFIG.BACKEND_URL)) {
                // Armazenar requisição para tentar novamente mais tarde
                SYSTEM_STATE.pendingRequests.push({url, options, timestamp: Date.now()});
                
                // Ativar modo offline
                activateOfflineMode();
                
                // Retornar resposta simulada para não quebrar o fluxo
                return createMockResponse(url, options);
            }
            
            throw error;
        }
    };
    
    // Interceptar erros não tratados
    window.addEventListener('error', function(event) {
        console.error('Erro não tratado:', event.error);
        
        // Se for erro de conexão, ativar modo offline
        if (event.error && (
            event.error.message.includes('fetch') || 
            event.error.message.includes('network') ||
            event.error.message.includes('connection')
        )) {
            activateOfflineMode();
        }
        
        // Mostrar mensagem amigável ao usuário
        showErrorMessage(event.error);
    });
    
    // Interceptar promessas rejeitadas não tratadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promessa rejeitada não tratada:', event.reason);
        
        // Se for erro de conexão, ativar modo offline
        if (event.reason && (
            event.reason.message.includes('fetch') || 
            event.reason.message.includes('network') ||
            event.reason.message.includes('connection')
        )) {
            activateOfflineMode();
        }
        
        // Mostrar mensagem amigável ao usuário
        showErrorMessage(event.reason);
    });
}

// Intercepta envios de formulário para funcionar offline
function setupFormInterception() {
    document.addEventListener('submit', function(event) {
        // Se estiver em modo offline
        if (SYSTEM_STATE.isOfflineMode) {
            // Prevenir envio normal do formulário
            event.preventDefault();
            
            // Obter dados do formulário
            const form = event.target;
            const formData = new FormData(form);
            const formDataObj = {};
            
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Armazenar para sincronização posterior
            SYSTEM_STATE.offlineForms.push({
                formId: form.id,
                action: form.action,
                method: form.method,
                data: formDataObj,
                timestamp: Date.now()
            });
            
            // Salvar no localStorage
            saveOfflineData();
            
            // Simular sucesso e redirecionar
            handleOfflineFormSuccess(form);
        }
    });
}

// Configura fallback específico para a página de completar cadastro
function setupCompletarCadastroFallback() {
    // Verificar se já existe um formulário na página
    const form = document.querySelector('form');
    
    if (!form) {
        // Se não existir (provavelmente devido a erro de conexão), criar formulário offline
        createOfflineCompletarCadastroForm();
    } else {
        // Se existir, adicionar tratamento de erro
        form.addEventListener('submit', function(event) {
            if (SYSTEM_STATE.isOfflineMode) {
                event.preventDefault();
                handleOfflineCompletarCadastro(form);
            }
        });
    }
}

// Cria formulário offline para completar cadastro
function createOfflineCompletarCadastroForm() {
    const main = document.querySelector('main') || document.body;
    const tipoUsuario = window.location.pathname.includes('locadora') ? 'locadora' : 'locatario';
    
    // Limpar conteúdo atual
    main.innerHTML = '';
    
    // Criar container
    const container = document.createElement('div');
    container.className = 'container';
    
    // Adicionar notificação de modo offline
    const notification = document.createElement('div');
    notification.className = 'notification offline-notification';
    notification.innerHTML = `
        <div class="notification-icon"><i class="fas fa-wifi-slash"></i></div>
        <div class="notification-content">
            <h3>Modo Demonstração Ativo</h3>
            <p>O servidor está temporariamente indisponível. Você está usando o sistema em modo de demonstração.</p>
        </div>
    `;
    container.appendChild(notification);
    
    // Criar cabeçalho da página
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<h1>Completar Cadastro de ${tipoUsuario === 'locadora' ? 'Locadora' : 'Locatário'}</h1>`;
    container.appendChild(header);
    
    // Criar formulário
    const form = document.createElement('form');
    form.id = `form-completar-${tipoUsuario}`;
    form.className = 'form-container';
    
    // Adicionar campos específicos para cada tipo de usuário
    if (tipoUsuario === 'locadora') {
        form.innerHTML = `
            <div class="form-group">
                <label for="razaoSocial">Razão Social</label>
                <input type="text" id="razaoSocial" name="razaoSocial" required>
            </div>
            <div class="form-group">
                <label for="cnpj">CNPJ</label>
                <input type="text" id="cnpj" name="cnpj" required>
            </div>
            <div class="form-group">
                <label for="telefone">Telefone</label>
                <input type="tel" id="telefone" name="telefone" required>
            </div>
            <div class="form-group">
                <label for="endereco">Endereço</label>
                <input type="text" id="endereco" name="endereco" required>
            </div>
            <div class="form-group">
                <label for="cidade">Cidade</label>
                <input type="text" id="cidade" name="cidade" required>
            </div>
            <div class="form-group">
                <label for="estado">Estado</label>
                <select id="estado" name="estado" required>
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                </select>
            </div>
        `;
    } else {
        form.innerHTML = `
            <div class="form-group">
                <label for="nome">Nome Completo</label>
                <input type="text" id="nome" name="nome" required>
            </div>
            <div class="form-group">
                <label for="cpf">CPF</label>
                <input type="text" id="cpf" name="cpf" required>
            </div>
            <div class="form-group">
                <label for="telefone">Telefone</label>
                <input type="tel" id="telefone" name="telefone" required>
            </div>
            <div class="form-group">
                <label for="endereco">Endereço</label>
                <input type="text" id="endereco" name="endereco" required>
            </div>
            <div class="form-group">
                <label for="cidade">Cidade</label>
                <input type="text" id="cidade" name="cidade" required>
            </div>
            <div class="form-group">
                <label for="estado">Estado</label>
                <select id="estado" name="estado" required>
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                </select>
            </div>
            <div class="form-group">
                <label for="cnh">CNH</label>
                <input type="text" id="cnh" name="cnh" required>
            </div>
        `;
    }
    
    // Adicionar botões
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'form-buttons';
    buttonsDiv.innerHTML = `
        <button type="button" class="btn btn-secondary" onclick="window.history.back()">Voltar</button>
        <button type="submit" class="btn btn-primary">Completar Cadastro</button>
    `;
    form.appendChild(buttonsDiv);
    
    // Adicionar evento de submit
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        handleOfflineCompletarCadastro(form);
    });
    
    container.appendChild(form);
    main.appendChild(container);
    
    // Adicionar indicador de modo demonstração
    addDemoModeIndicator();
}

// Trata envio de formulário de completar cadastro no modo offline
function handleOfflineCompletarCadastro(form) {
    // Obter dados do formulário
    const formData = new FormData(form);
    const formDataObj = {};
    
    formData.forEach((value, key) => {
        formDataObj[key] = value;
    });
    
    // Obter tipo de usuário
    const tipoUsuario = window.location.pathname.includes('locadora') ? 'locadora' : 'locatario';
    
    // Obter usuário atual do localStorage
    let usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    // Atualizar dados do usuário
    usuario = {
        ...usuario,
        ...formDataObj,
        perfilCompleto: true,
        tipo: tipoUsuario
    };
    
    // Salvar no localStorage
    localStorage.setItem('usuario', JSON.stringify(usuario));
    
    // Armazenar para sincronização posterior
    SYSTEM_STATE.offlineForms.push({
        formId: form.id,
        action: `${CONFIG.BACKEND_URL}/api/${tipoUsuario}/completar`,
        method: 'POST',
        data: formDataObj,
        timestamp: Date.now()
    });
    
    // Salvar no localStorage
    saveOfflineData();
    
    // Mostrar mensagem de sucesso
    showSuccessMessage('Cadastro completado com sucesso no modo demonstração!');
    
    // Redirecionar para dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}

// Trata sucesso de formulário no modo offline
function handleOfflineFormSuccess(form) {
    // Identificar tipo de formulário e redirecionar adequadamente
    const formId = form.id;
    
    if (formId.includes('login')) {
        // Simular login bem-sucedido
        const email = form.querySelector('[name="email"]').value;
        const senha = form.querySelector('[name="senha"]').value;
        
        // Buscar usuário nos dados de demonstração
        const usuarios = JSON.parse(localStorage.getItem('demoUsuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email);
        
        if (usuario) {
            // Salvar no localStorage
            localStorage.setItem('usuario', JSON.stringify({
                ...usuario,
                loggedIn: true
            }));
            
            // Redirecionar para dashboard
            showSuccessMessage('Login realizado com sucesso no modo demonstração!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showErrorMessage('Usuário não encontrado no modo demonstração.');
        }
    } else if (formId.includes('cadastro')) {
        // Simular cadastro bem-sucedido
        const email = form.querySelector('[name="email"]').value;
        const senha = form.querySelector('[name="senha"]').value;
        const tipo = form.querySelector('[name="tipo"]')?.value || 
                    document.querySelector('input[name="tipo"]:checked')?.value;
        
        // Salvar no localStorage
        localStorage.setItem('usuario', JSON.stringify({
            id: Date.now(),
            email,
            tipo,
            perfilCompleto: false,
            loggedIn: true
        }));
        
        // Redirecionar para completar cadastro
        showSuccessMessage('Cadastro inicial realizado com sucesso no modo demonstração!');
        setTimeout(() => {
            window.location.href = `completar-cadastro-${tipo}.html`;
        }, 1500);
    } else {
        // Para outros formulários, mostrar mensagem genérica
        showSuccessMessage('Operação realizada com sucesso no modo demonstração!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
}

// Cria resposta simulada para requisições fetch
function createMockResponse(url, options) {
    // Analisar URL para determinar tipo de resposta
    const urlObj = new URL(url.toString());
    const path = urlObj.pathname;
    
    // Resposta padrão
    let responseData = { success: true, message: 'Operação simulada no modo offline' };
    let status = 200;
    
    // Personalizar resposta com base no caminho
    if (path.includes('/api/auth/login')) {
        // Simular login
        const body = options.body ? JSON.parse(options.body) : {};
        const email = body.email;
        
        // Buscar usuário nos dados de demonstração
        const usuarios = JSON.parse(localStorage.getItem('demoUsuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email);
        
        if (usuario) {
            responseData = {
                success: true,
                token: 'demo-token-' + Date.now(),
                usuario: {
                    ...usuario,
                    loggedIn: true
                }
            };
        } else {
            responseData = { success: false, message: 'Usuário não encontrado' };
            status = 401;
        }
    } else if (path.includes('/api/auth/cadastro')) {
        // Simular cadastro
        const body = options.body ? JSON.parse(options.body) : {};
        
        responseData = {
            success: true,
            token: 'demo-token-' + Date.now(),
            usuario: {
                id: Date.now(),
                email: body.email,
                tipo: body.tipo,
                perfilCompleto: false,
                loggedIn: true
            }
        };
    }
    
    // Criar resposta simulada
    const blob = new Blob([JSON.stringify(responseData)], { type: 'application/json' });
    const response = new Response(blob, {
        status: status,
        headers: { 'Content-Type': 'application/json' }
    });
    
    return Promise.resolve(response);
}

// Mostra notificação de modo offline
function showOfflineNotification() {
    // Verificar se já existe
    if (document.querySelector('.offline-notification')) {
        return;
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = 'notification offline-notification';
    notification.innerHTML = `
        <div class="notification-icon"><i class="fas fa-wifi-slash"></i></div>
        <div class="notification-content">
            <h3>Modo Demonstração Ativo</h3>
            <p>O servidor está temporariamente indisponível. Você está usando o sistema em modo de demonstração.</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Adicionar ao corpo
    document.body.appendChild(notification);
    
    // Adicionar indicador de modo demonstração
    addDemoModeIndicator();
}

// Remove notificação de modo offline
function removeOfflineNotification() {
    const notification = document.querySelector('.offline-notification');
    if (notification) {
        notification.remove();
    }
    
    // Remover indicador de modo demonstração
    removeDemoModeIndicator();
}

// Adiciona indicador de modo demonstração
function addDemoModeIndicator() {
    // Verificar se já existe
    if (document.querySelector('.demo-mode-indicator')) {
        return;
    }
    
    // Criar indicador
    const indicator = document.createElement('div');
    indicator.className = 'demo-mode-indicator';
    indicator.textContent = 'MODO DEMONSTRAÇÃO';
    
    // Adicionar ao corpo
    document.body.appendChild(indicator);
}

// Remove indicador de modo demonstração
function removeDemoModeIndicator() {
    const indicator = document.querySelector('.demo-mode-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Mostra mensagem de erro
function showErrorMessage(error) {
    // Criar mensagem
    const message = document.createElement('div');
    message.className = 'notification error-notification';
    
    // Determinar mensagem amigável
    let friendlyMessage = 'Ocorreu um erro inesperado.';
    let detailMessage = '';
    
    if (error) {
        if (typeof error === 'string') {
            detailMessage = error;
        } else if (error.message) {
            detailMessage = error.message;
        }
        
        // Personalizar mensagem com base no erro
        if (detailMessage.includes('fetch') || 
            detailMessage.includes('network') ||
            detailMessage.includes('connection') ||
            detailMessage.includes('Failed to fetch')) {
            friendlyMessage = 'Erro de conexão com o servidor.';
            detailMessage = 'O sistema está operando em modo de demonstração devido a problemas de conexão.';
        }
    }
    
    // Definir conteúdo
    message.innerHTML = `
        <div class="notification-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div class="notification-content">
            <h3>${friendlyMessage}</h3>
            <p>${detailMessage}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Adicionar ao corpo
    document.body.appendChild(message);
    
    // Remover após 5 segundos
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Mostra mensagem de sucesso
function showSuccessMessage(text) {
    // Criar mensagem
    const message = document.createElement('div');
    message.className = 'notification success-notification';
    message.innerHTML = `
        <div class="notification-icon"><i class="fas fa-check-circle"></i></div>
        <div class="notification-content">
            <h3>Sucesso!</h3>
            <p>${text}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Adicionar ao corpo
    document.body.appendChild(message);
    
    // Remover após 5 segundos
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Carrega dados de demonstração
function loadDemoData() {
    // Verificar se já existem dados no localStorage
    if (!localStorage.getItem('demoUsuarios')) {
        // Criar dados de demonstração
        const demoUsuarios = [
            {
                id: 1,
                email: 'autoflex@exemplo.com',
                senha: 'Autoflex@2025',
                tipo: 'locadora',
                perfilCompleto: true,
                razaoSocial: 'Auto Flex Locadora de Veículos LTDA',
                cnpj: '12.345.678/0001-90',
                telefone: '(11) 3456-7890',
                endereco: 'Av. Paulista, 1000',
                cidade: 'São Paulo',
                estado: 'SP',
                avaliacao: 4.7
            },
            {
                id: 2,
                email: 'carroja@exemplo.com',
                senha: 'CarroJa@2025',
                tipo: 'locadora',
                perfilCompleto: true,
                razaoSocial: 'Carro Já Locações S.A.',
                cnpj: '98.765.432/0001-10',
                telefone: '(21) 2345-6789',
                endereco: 'Rua da Praia, 500',
                cidade: 'Rio de Janeiro',
                estado: 'RJ',
                avaliacao: 4.2
            },
            {
                id: 3,
                email: 'ana.silva@exemplo.com',
                senha: 'Ana@2025',
                tipo: 'locatario',
                perfilCompleto: true,
                nome: 'Ana Silva',
                cpf: '123.456.789-00',
                telefone: '(11) 98765-4321',
                endereco: 'Rua das Flores, 123',
                cidade: 'São Paulo',
                estado: 'SP',
                cnh: '12345678900',
                avaliacao: 4.9
            },
            {
                id: 4,
                email: 'carlos.oliveira@exemplo.com',
                senha: 'Carlos@2025',
                tipo: 'locatario',
                perfilCompleto: true,
                nome: 'Carlos Oliveira',
                cpf: '987.654.321-00',
                telefone: '(21) 98765-1234',
                endereco: 'Av. Atlântica, 456',
                cidade: 'Rio de Janeiro',
                estado: 'RJ',
                cnh: '09876543211',
                avaliacao: 4.5
            },
            {
                id: 5,
                email: 'mariana.santos@exemplo.com',
                senha: 'Mariana@2025',
                tipo: 'locatario',
                perfilCompleto: true,
                nome: 'Mariana Santos',
                cpf: '456.789.123-00',
                telefone: '(31) 97654-3210',
                endereco: 'Rua da Serra, 789',
                cidade: 'Belo Horizonte',
                estado: 'MG',
                cnh: '45678912300',
                avaliacao: 4.8
            },
            {
                id: 6,
                email: 'pedro.costa@exemplo.com',
                senha: 'Pedro@2025',
                tipo: 'locatario',
                perfilCompleto: true,
                nome: 'Pedro Costa',
                cpf: '321.654.987-00',
                telefone: '(41) 96543-2109',
                endereco: 'Av. das Araucárias, 321',
                cidade: 'Curitiba',
                estado: 'PR',
                cnh: '32165498700',
                avaliacao: 4.3
            },
            {
                id: 7,
                email: 'juliana.lima@exemplo.com',
                senha: 'Juliana@2025',
                tipo: 'locatario',
                perfilCompleto: true,
                nome: 'Juliana Lima',
                cpf: '654.321.987-00',
                telefone: '(51) 95432-1098',
                endereco: 'Rua dos Andradas, 654',
                cidade: 'Porto Alegre',
                estado: 'RS',
                cnh: '65432198700',
                avaliacao: 4.6
            },
            {
                id: 8,
                email: 'roberto.almeida@exemplo.com',
                senha: 'Roberto@2025',
                tipo: 'locatario',
                perfilCompleto: true,
                nome: 'Roberto Almeida',
                cpf: '789.123.456-00',
                telefone: '(81) 94321-0987',
                endereco: 'Av. Boa Viagem, 987',
                cidade: 'Recife',
                estado: 'PE',
                cnh: '78912345600',
                avaliacao: 4.4
            }
        ];
        
        // Salvar no localStorage
        localStorage.setItem('demoUsuarios', JSON.stringify(demoUsuarios));
        
        // Criar carros de demonstração
        const demoCarros = [
            // Carros da Auto Flex
            {
                id: 1,
                locadoraId: 1,
                marca: 'Toyota',
                modelo: 'Corolla',
                ano: 2023,
                placa: 'ABC1D23',
                cor: 'Prata',
                quilometragem: 15000,
                valorDiaria: 150.00,
                disponivel: true
            },
            {
                id: 2,
                locadoraId: 1,
                marca: 'Honda',
                modelo: 'Civic',
                ano: 2022,
                placa: 'DEF4G56',
                cor: 'Preto',
                quilometragem: 22000,
                valorDiaria: 140.00,
                disponivel: true
            },
            {
                id: 3,
                locadoraId: 1,
                marca: 'Jeep',
                modelo: 'Renegade',
                ano: 2023,
                placa: 'GHI7J89',
                cor: 'Branco',
                quilometragem: 18000,
                valorDiaria: 180.00,
                disponivel: true
            },
            {
                id: 4,
                locadoraId: 1,
                marca: 'Volkswagen',
                modelo: 'T-Cross',
                ano: 2022,
                placa: 'JKL1M23',
                cor: 'Azul',
                quilometragem: 25000,
                valorDiaria: 170.00,
                disponivel: true
            },
            {
                id: 5,
                locadoraId: 1,
                marca: 'Hyundai',
                modelo: 'HB20',
                ano: 2023,
                placa: 'NOP4Q56',
                cor: 'Vermelho',
                quilometragem: 12000,
                valorDiaria: 120.00,
                disponivel: true
            },
            
            // Carros da Carro Já
            {
                id: 6,
                locadoraId: 2,
                marca: 'Fiat',
                modelo: 'Pulse',
                ano: 2023,
                placa: 'QRS7T89',
                cor: 'Cinza',
                quilometragem: 10000,
                valorDiaria: 130.00,
                disponivel: true
            },
            {
                id: 7,
                locadoraId: 2,
                marca: 'Chevrolet',
                modelo: 'Onix',
                ano: 2022,
                placa: 'UVW1X23',
                cor: 'Prata',
                quilometragem: 20000,
                valorDiaria: 110.00,
                disponivel: true
            },
            {
                id: 8,
                locadoraId: 2,
                marca: 'Renault',
                modelo: 'Kwid',
                ano: 2023,
                placa: 'YZA4B56',
                cor: 'Branco',
                quilometragem: 15000,
                valorDiaria: 100.00,
                disponivel: true
            },
            {
                id: 9,
                locadoraId: 2,
                marca: 'Nissan',
                modelo: 'Kicks',
                ano: 2022,
                placa: 'CDE7F89',
                cor: 'Preto',
                quilometragem: 18000,
                valorDiaria: 160.00,
                disponivel: true
            },
            {
                id: 10,
                locadoraId: 2,
                marca: 'Ford',
                modelo: 'Territory',
                ano: 2023,
                placa: 'GHI1J23',
                cor: 'Azul',
                quilometragem: 12000,
                valorDiaria: 190.00,
                disponivel: true
            }
        ];
        
        // Salvar no localStorage
        localStorage.setItem('demoCarros', JSON.stringify(demoCarros));
        
        // Criar locações de demonstração
        const demoLocacoes = [
            {
                id: 1,
                carroId: 1,
                locadoraId: 1,
                locatarioId: 3,
                dataInicio: '2025-03-15',
                dataFim: '2025-03-20',
                valorTotal: 750.00,
                status: 'Concluída',
                avaliacaoLocadora: 5,
                avaliacaoLocatario: 5,
                comentarioLocadora: 'Ótimo cliente, devolveu o carro em perfeitas condições.',
                comentarioLocatario: 'Carro em excelente estado, atendimento impecável.'
            },
            {
                id: 2,
                carroId: 6,
                locadoraId: 2,
                locatarioId: 4,
                dataInicio: '2025-03-18',
                dataFim: '2025-03-25',
                valorTotal: 910.00,
                status: 'Concluída',
                avaliacaoLocadora: 4,
                avaliacaoLocatario: 4,
                comentarioLocadora: 'Cliente pontual e cuidadoso.',
                comentarioLocatario: 'Bom atendimento, carro conforme o anunciado.'
            },
            {
                id: 3,
                carroId: 2,
                locadoraId: 1,
                locatarioId: 5,
                dataInicio: '2025-04-01',
                dataFim: '2025-04-05',
                valorTotal: 560.00,
                status: 'Concluída',
                avaliacaoLocadora: 5,
                avaliacaoLocatario: 4,
                comentarioLocadora: 'Cliente muito educado e pontual.',
                comentarioLocatario: 'Carro em bom estado, processo de locação tranquilo.'
            },
            {
                id: 4,
                carroId: 7,
                locadoraId: 2,
                locatarioId: 6,
                dataInicio: '2025-04-10',
                dataFim: '2025-04-15',
                valorTotal: 550.00,
                status: 'Concluída',
                avaliacaoLocadora: 3,
                avaliacaoLocatario: 4,
                comentarioLocadora: 'Cliente devolveu o carro com pequenos arranhões.',
                comentarioLocatario: 'Atendimento bom, mas o carro apresentou alguns problemas.'
            },
            {
                id: 5,
                carroId: 3,
                locadoraId: 1,
                locatarioId: 7,
                dataInicio: '2025-04-20',
                dataFim: '2025-04-25',
                valorTotal: 900.00,
                status: 'Em andamento',
                avaliacaoLocadora: null,
                avaliacaoLocatario: null,
                comentarioLocadora: '',
                comentarioLocatario: ''
            },
            {
                id: 6,
                carroId: 8,
                locadoraId: 2,
                locatarioId: 8,
                dataInicio: '2025-04-22',
                dataFim: '2025-04-30',
                valorTotal: 800.00,
                status: 'Em andamento',
                avaliacaoLocadora: null,
                avaliacaoLocatario: null,
                comentarioLocadora: '',
                comentarioLocatario: ''
            },
            {
                id: 7,
                carroId: 4,
                locadoraId: 1,
                locatarioId: 3,
                dataInicio: '2025-05-10',
                dataFim: '2025-05-15',
                valorTotal: 850.00,
                status: 'Agendada',
                avaliacaoLocadora: null,
                avaliacaoLocatario: null,
                comentarioLocadora: '',
                comentarioLocatario: ''
            },
            {
                id: 8,
                carroId: 9,
                locadoraId: 2,
                locatarioId: 4,
                dataInicio: '2025-05-12',
                dataFim: '2025-05-20',
                valorTotal: 1280.00,
                status: 'Agendada',
                avaliacaoLocadora: null,
                avaliacaoLocatario: null,
                comentarioLocadora: '',
                comentarioLocatario: ''
            }
        ];
        
        // Salvar no localStorage
        localStorage.setItem('demoLocacoes', JSON.stringify(demoLocacoes));
    }
}

// Salva dados offline
function saveOfflineData() {
    localStorage.setItem('offlineForms', JSON.stringify(SYSTEM_STATE.offlineForms));
    localStorage.setItem('pendingRequests', JSON.stringify(SYSTEM_STATE.pendingRequests));
}

// Sincroniza dados offline quando a conexão for restaurada
async function syncOfflineData() {
    // Carregar dados do localStorage
    SYSTEM_STATE.offlineForms = JSON.parse(localStorage.getItem('offlineForms') || '[]');
    SYSTEM_STATE.pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    
    // Se não houver dados para sincronizar, retornar
    if (SYSTEM_STATE.offlineForms.length === 0 && SYSTEM_STATE.pendingRequests.length === 0) {
        return;
    }
    
    console.log('Sincronizando dados offline...');
    
    // Tentar enviar formulários offline
    for (const form of SYSTEM_STATE.offlineForms) {
        try {
            const response = await fetch(form.action, {
                method: form.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form.data)
            });
            
            if (response.ok) {
                console.log(`Formulário ${form.formId} sincronizado com sucesso.`);
            } else {
                console.warn(`Erro ao sincronizar formulário ${form.formId}:`, await response.text());
            }
        } catch (error) {
            console.error(`Erro ao sincronizar formulário ${form.formId}:`, error);
        }
    }
    
    // Tentar reenviar requisições pendentes
    for (const request of SYSTEM_STATE.pendingRequests) {
        try {
            const response = await fetch(request.url, request.options);
            
            if (response.ok) {
                console.log(`Requisição para ${request.url} sincronizada com sucesso.`);
            } else {
                console.warn(`Erro ao sincronizar requisição para ${request.url}:`, await response.text());
            }
        } catch (error) {
            console.error(`Erro ao sincronizar requisição para ${request.url}:`, error);
        }
    }
    
    // Limpar dados sincronizados
    SYSTEM_STATE.offlineForms = [];
    SYSTEM_STATE.pendingRequests = [];
    
    // Atualizar localStorage
    localStorage.removeItem('offlineForms');
    localStorage.removeItem('pendingRequests');
    
    console.log('Sincronização de dados offline concluída.');
}

// Verificar conexão periodicamente
setInterval(checkBackendConnection, 30000);
