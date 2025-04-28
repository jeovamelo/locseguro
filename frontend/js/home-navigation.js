// Adicionar funcionalidade de clique aos cards de funcionalidades
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página inicial
    if (window.location.pathname === '/' || 
        window.location.pathname === '/index.html' || 
        window.location.pathname.endsWith('index.html')) {
        
        // Adicionar link aos cards de funcionalidades
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
            card.addEventListener('click', function() {
                // Verificar se o usuário está logado
                const usuario = localStorage.getItem('usuario');
                
                if (!usuario) {
                    // Se não estiver logado, redirecionar para login
                    window.location.href = 'login.html?redirect=' + getRedirectUrl(index);
                } else {
                    try {
                        const usuarioObj = JSON.parse(usuario);
                        
                        // Verificar permissões baseadas no tipo de usuário
                        if (checkPermission(usuarioObj.tipo, index)) {
                            // Redirecionar para a página correspondente
                            window.location.href = getRedirectUrl(index);
                        } else {
                            // Redirecionar para página de acesso negado
                            window.location.href = 'acesso-negado.html';
                        }
                    } catch (error) {
                        console.error('Erro ao processar informações do usuário:', error);
                        window.location.href = 'login.html?error=invalid_session';
                    }
                }
            });
        });
    }
});

// Função para obter URL de redirecionamento baseado no índice do card
function getRedirectUrl(index) {
    switch (index) {
        case 0: // Cadastro de Locadoras
            return 'cadastro-locadora.html';
        case 1: // Cadastro de Locatários
            return 'cadastro-locatario.html';
        case 2: // Cadastro de Carros
            return 'cadastro-carro.html';
        case 3: // Cadastro de Locações
            return 'cadastro-locacao.html';
        case 4: // Avaliações
            return 'avaliacao.html';
        case 5: // Consulta Pública
            return 'consulta-publica.html';
        default:
            return 'dashboard.html';
    }
}

// Função para verificar permissões baseadas no tipo de usuário
function checkPermission(tipoUsuario, index) {
    // Consulta pública é acessível para todos
    if (index === 5) return true;
    
    if (tipoUsuario === 'locadora') {
        // Locadoras podem acessar: cadastro de carros, cadastro de locações, avaliações
        return index === 2 || index === 3 || index === 4;
    } else if (tipoUsuario === 'locatario') {
        // Locatários podem acessar: avaliações
        return index === 4;
    }
    
    return false;
}
