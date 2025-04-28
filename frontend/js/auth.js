// Arquivo JavaScript para lidar com autenticação
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de login
    if (document.getElementById('login-form')) {
        const loginForm = document.getElementById('login-form');
        const authMessage = document.getElementById('auth-message');
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            // Limpar mensagens anteriores
            authMessage.innerHTML = '';
            authMessage.style.display = 'none';
            
            try {
                // Verificar se o backend está disponível
                await window.api.inicializar();
                
                // Tentar fazer login
                console.log('Tentando fazer login com:', email);
                const response = await window.api.auth.login(email, senha);
                
                if (response.success) {
                    // Salvar dados do usuário
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('usuario', JSON.stringify({
                        id: response.data.usuario_id,
                        email: response.data.email,
                        tipo: response.data.tipo,
                        cadastro_completo: response.data.cadastro_completo
                    }));
                    
                    // Mostrar mensagem de sucesso
                    authMessage.innerHTML = `
                        <div class="success-message">
                            <div class="success-title">Login realizado com sucesso!</div>
                            <p>Redirecionando...</p>
                        </div>
                    `;
                    authMessage.style.display = 'block';
                    
                    // Redirecionar após login
                    setTimeout(() => {
                        window.api.auth.redirecionarAposLogin();
                    }, 1000);
                } else {
                    // Mostrar mensagem de erro
                    authMessage.innerHTML = `
                        <div class="error-message">
                            <div class="error-title">Erro ao fazer login</div>
                            <p>${response.message || 'Ocorreu um erro inesperado.'}</p>
                        </div>
                    `;
                    authMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                
                // Mostrar mensagem de erro com soluções
                authMessage.innerHTML = `
                    <div class="error-message">
                        <div class="error-title">Erro ao fazer login</div>
                        <p>${error.message || 'Ocorreu um erro inesperado.'}</p>
                        <div class="error-solution">
                            <p>Possíveis soluções:</p>
                            <ul>
                                <li>Verifique se o email e senha estão corretos</li>
                                <li>O sistema está funcionando em modo de demonstração devido à indisponibilidade temporária do servidor</li>
                                <li>Tente usar uma das contas de teste listadas abaixo</li>
                            </ul>
                        </div>
                    </div>
                `;
                authMessage.style.display = 'block';
            }
        });
        
        // Função para alternar visibilidade da senha
        window.togglePasswordVisibility = function(button) {
            const input = button.previousElementSibling;
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        };
    }
    
    // Verificar se estamos na página de cadastro
    if (document.getElementById('cadastro-form')) {
        const cadastroForm = document.getElementById('cadastro-form');
        const authMessage = document.getElementById('auth-message');
        
        // Função para selecionar tipo de usuário
        window.selecionarTipoUsuario = function(tipo, elemento) {
            // Atualizar campo oculto
            document.getElementById('tipo-usuario').value = tipo;
            
            // Atualizar estilo dos elementos
            document.querySelectorAll('.user-type-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            elemento.classList.add('selected');
            
            // Avançar para próxima etapa
            document.getElementById('step-1').classList.remove('active');
            document.getElementById('step-2').classList.add('active');
        };
        
        // Função para voltar para etapa 1
        window.voltarParaEtapa1 = function() {
            document.getElementById('step-2').classList.remove('active');
            document.getElementById('step-1').classList.add('active');
        };
        
        cadastroForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const tipo = document.getElementById('tipo-usuario').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            
            // Limpar mensagens anteriores
            authMessage.innerHTML = '';
            authMessage.style.display = 'none';
            
            // Validar senha
            const validacaoSenha = window.validacaoSenha.validar(senha);
            if (!validacaoSenha.valid) {
                authMessage.innerHTML = `
                    <div class="error-message">
                        <div class="error-title">Senha inválida</div>
                        <p>A senha não atende aos requisitos de segurança:</p>
                        <ul>
                            ${validacaoSenha.errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                `;
                authMessage.style.display = 'block';
                return;
            }
            
            // Verificar se as senhas coincidem
            if (senha !== confirmarSenha) {
                authMessage.innerHTML = `
                    <div class="error-message">
                        <div class="error-title">Senhas não coincidem</div>
                        <p>A senha e a confirmação de senha devem ser idênticas.</p>
                    </div>
                `;
                authMessage.style.display = 'block';
                return;
            }
            
            try {
                // Verificar se o backend está disponível
                await window.api.inicializar();
                
                // Tentar registrar usuário
                console.log('Tentando registrar usuário:', email, tipo);
                const response = await window.api.auth.registrar(email, senha, tipo);
                
                if (response.success) {
                    // Salvar dados do usuário
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('usuario', JSON.stringify({
                        id: response.data.usuario_id,
                        email: response.data.email,
                        tipo: response.data.tipo,
                        cadastro_completo: response.data.cadastro_completo
                    }));
                    
                    // Mostrar mensagem de sucesso
                    authMessage.innerHTML = `
                        <div class="success-message">
                            <div class="success-title">Cadastro realizado com sucesso!</div>
                            <p>Redirecionando para completar seu perfil...</p>
                        </div>
                    `;
                    authMessage.style.display = 'block';
                    
                    // Redirecionar para completar cadastro
                    setTimeout(() => {
                        if (tipo === 'locadora') {
                            window.location.href = 'completar-cadastro-locadora.html';
                        } else {
                            window.location.href = 'completar-cadastro-locatario.html';
                        }
                    }, 1000);
                } else {
                    // Mostrar mensagem de erro
                    authMessage.innerHTML = `
                        <div class="error-message">
                            <div class="error-title">Erro ao cadastrar</div>
                            <p>${response.message || 'Ocorreu um erro inesperado.'}</p>
                        </div>
                    `;
                    authMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Erro ao cadastrar:', error);
                
                // Mostrar mensagem de erro com soluções
                authMessage.innerHTML = `
                    <div class="error-message">
                        <div class="error-title">Erro ao cadastrar</div>
                        <p>${error.message || 'Ocorreu um erro inesperado.'}</p>
                        <div class="error-solution">
                            <p>Possíveis soluções:</p>
                            <ul>
                                <li>Verifique se o email é válido e não está em uso</li>
                                <li>O sistema está funcionando em modo de demonstração devido à indisponibilidade temporária do servidor</li>
                                <li>Tente novamente mais tarde ou use uma das contas de teste na página de login</li>
                            </ul>
                        </div>
                    </div>
                `;
                authMessage.style.display = 'block';
            }
        });
    }
});
