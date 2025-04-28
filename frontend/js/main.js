// Atualização do arquivo main.js para integrar com a API

document.addEventListener('DOMContentLoaded', function() {
    // Inicialização do sistema
    initializeSystem();
    
    // Configurar validações de formulários
    setupFormValidations();
    
    // Configurar sistema de avaliação por estrelas
    setupStarRating();
    
    // Configurar upload de imagens
    setupImageUpload();
    
    // Configurar integração com API
    setupApiIntegration();
});

// Inicialização do sistema
function initializeSystem() {
    console.log('Sistema LOC Seguro inicializado');
    
    // Verificar página atual e carregar funcionalidades específicas
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'cadastro-locadora':
            setupLocadoraForm();
            break;
        case 'cadastro-locatario':
            setupLocatarioForm();
            break;
        case 'cadastro-carro':
            setupCarroForm();
            break;
        case 'cadastro-locacao':
            setupLocacaoForm();
            break;
        case 'avaliacao':
            setupAvaliacaoForm();
            break;
        case 'consulta-publica':
            setupConsultaPublica();
            break;
        default:
            // Página inicial ou outra página
            break;
    }
}

// Configurar integração com API
function setupApiIntegration() {
    // Verificar se a API está disponível
    if (!window.api) {
        console.error('API não encontrada. Verifique se o arquivo api.js foi carregado corretamente.');
        return;
    }
    
    // Verificar página atual
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'cadastro-locadora':
            setupLocadoraApi();
            break;
        case 'cadastro-locatario':
            setupLocatarioApi();
            break;
        case 'cadastro-carro':
            setupCarroApi();
            break;
        case 'cadastro-locacao':
            setupLocacaoApi();
            break;
        case 'avaliacao':
            setupAvaliacaoApi();
            break;
        case 'consulta-publica':
            setupConsultaApi();
            break;
        default:
            // Página inicial ou outra página
            break;
    }
}

// Integração API - Locadora
function setupLocadoraApi() {
    const form = document.getElementById('form-locadora');
    
    if (!form) return;
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validateForm(this)) {
            return;
        }
        
        try {
            const locadoraData = {
                razao_social: document.getElementById('razao_social').value,
                nome_fantasia: document.getElementById('nome_fantasia').value,
                cnpj: document.getElementById('cnpj').value,
                inscricao_estadual: document.getElementById('inscricao_estadual').value,
                cep: document.getElementById('cep').value,
                rua: document.getElementById('rua').value,
                numero: document.getElementById('numero').value,
                complemento: document.getElementById('complemento').value,
                bairro: document.getElementById('bairro').value,
                cidade: document.getElementById('cidade').value,
                estado: document.getElementById('estado').value,
                telefone_comercial: document.getElementById('telefone_comercial').value,
                email_comercial: document.getElementById('email_comercial').value,
                responsavel_nome: document.getElementById('responsavel_nome').value,
                responsavel_cpf: document.getElementById('responsavel_cpf').value,
                responsavel_data_nascimento: document.getElementById('responsavel_data_nascimento').value,
                responsavel_telefone: document.getElementById('responsavel_telefone').value,
                responsavel_email: document.getElementById('responsavel_email').value
            };
            
            const result = await window.api.locadoras.cadastrar(locadoraData);
            
            alert('Locadora cadastrada com sucesso!');
            form.reset();
            
        } catch (error) {
            alert(`Erro ao cadastrar locadora: ${error.message}`);
            console.error('Erro ao cadastrar locadora:', error);
        }
    });
}

// Integração API - Locatário
function setupLocatarioApi() {
    const form = document.getElementById('form-locatario');
    
    if (!form) return;
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validateForm(this)) {
            return;
        }
        
        try {
            const locatarioData = {
                nome_completo: document.getElementById('nome_completo').value,
                cpf: document.getElementById('cpf').value,
                data_nascimento: document.getElementById('data_nascimento').value,
                telefone: document.getElementById('telefone').value,
                email: document.getElementById('email').value,
                cep: document.getElementById('cep').value,
                rua: document.getElementById('rua').value,
                numero: document.getElementById('numero').value,
                complemento: document.getElementById('complemento').value,
                bairro: document.getElementById('bairro').value,
                cidade: document.getElementById('cidade').value,
                estado: document.getElementById('estado').value,
                cnh_numero: document.getElementById('cnh_numero').value,
                cnh_categoria: document.getElementById('cnh_categoria').value,
                cnh_data_emissao: document.getElementById('cnh_data_emissao').value,
                cnh_validade: document.getElementById('cnh_validade').value,
                cnh_orgao_emissor: document.getElementById('cnh_orgao_emissor').value,
                cnh_uf_emissao: document.getElementById('cnh_uf_emissao').value
            };
            
            const result = await window.api.locatarios.cadastrar(locatarioData);
            
            alert('Locatário cadastrado com sucesso!');
            form.reset();
            
        } catch (error) {
            alert(`Erro ao cadastrar locatário: ${error.message}`);
            console.error('Erro ao cadastrar locatário:', error);
        }
    });
}

// Integração API - Carro
function setupCarroApi() {
    const form = document.getElementById('form-carro');
    
    if (!form) return;
    
    // Carregar locadoras para o select
    loadLocadoras();
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validateForm(this)) {
            return;
        }
        
        try {
            const carroData = {
                locadora_id: 1, // Temporário, deve ser selecionado pelo usuário
                marca: document.getElementById('marca').value,
                modelo: document.getElementById('modelo').value,
                ano_fabricacao: document.getElementById('ano_fabricacao').value,
                ano_modelo: document.getElementById('ano_modelo').value,
                cor: document.getElementById('cor').value,
                placa: document.getElementById('placa').value,
                chassi: document.getElementById('chassi').value,
                quilometragem: document.getElementById('quilometragem').value,
                valor_diaria: document.getElementById('valor_diaria').value,
                observacoes: document.getElementById('observacoes').value
            };
            
            // Cadastrar o carro
            const result = await window.api.carros.cadastrar(carroData);
            
            // Obter as fotos selecionadas
            const fotosInputs = document.querySelectorAll('.image-preview img');
            const fotos = Array.from(fotosInputs).map(img => {
                // Converter base64 para Blob
                return dataURLtoBlob(img.src);
            }).filter(blob => blob !== null);
            
            // Fazer upload das fotos
            if (fotos.length > 0) {
                await window.api.carros.uploadFotos(result.id, fotos);
            }
            
            alert('Carro cadastrado com sucesso!');
            form.reset();
            
            // Limpar previews de imagens
            document.querySelectorAll('.image-preview').forEach(preview => {
                preview.innerHTML = `
                    <div class="image-preview-placeholder">
                        <i class="fas fa-camera"></i>
                        <div>Adicionar foto</div>
                    </div>
                `;
            });
            
        } catch (error) {
            alert(`Erro ao cadastrar carro: ${error.message}`);
            console.error('Erro ao cadastrar carro:', error);
        }
    });
    
    // Função para carregar locadoras
    async function loadLocadoras() {
        try {
            const locadoras = await window.api.locadoras.listar();
            // Implementar preenchimento do select de locadoras
        } catch (error) {
            console.error('Erro ao carregar locadoras:', error);
        }
    }
    
    // Função para converter dataURL para Blob
    function dataURLtoBlob(dataURL) {
        if (!dataURL) return null;
        
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
}

// Integração API - Locação
function setupLocacaoApi() {
    const form = document.getElementById('form-locacao');
    
    if (!form) return;
    
    // Carregar carros e locatários para os selects
    loadCarros();
    loadLocatarios();
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validateForm(this)) {
            return;
        }
        
        try {
            const locacaoData = {
                carro_id: document.getElementById('carro').value,
                locadora_id: 1, // Será obtido do carro selecionado
                locatario_id: document.getElementById('locatario').value,
                data_inicio: document.getElementById('data_inicio').value,
                data_fim: document.getElementById('data_fim').value,
                valor_total: document.getElementById('valor_total').value,
                observacoes: document.getElementById('observacoes').value,
                retroativa: document.getElementById('retroativa').checked
            };
            
            const result = await window.api.locacoes.cadastrar(locacaoData);
            
            alert('Locação cadastrada com sucesso!');
            form.reset();
            
        } catch (error) {
            alert(`Erro ao cadastrar locação: ${error.message}`);
            console.error('Erro ao cadastrar locação:', error);
        }
    });
    
    // Função para carregar carros
    async function loadCarros() {
        try {
            const carros = await window.api.carros.listar();
            const carroSelect = document.getElementById('carro');
            
            if (carroSelect && carros.length > 0) {
                carroSelect.innerHTML = '<option value="">Selecione um carro</option>';
                
                carros.forEach(carro => {
                    const option = document.createElement('option');
                    option.value = carro.id;
                    option.textContent = `${carro.marca} ${carro.modelo} (${carro.placa})`;
                    option.dataset.valorDiaria = carro.valor_diaria;
                    option.dataset.locadoraId = carro.locadora_id;
                    carroSelect.appendChild(option);
                });
                
                // Evento para atualizar o valor da diária quando um carro for selecionado
                carroSelect.addEventListener('change', function() {
                    const selectedOption = this.options[this.selectedIndex];
                    const valorDiaria = selectedOption.dataset.valorDiaria || 0;
                    document.getElementById('valor_diaria').value = valorDiaria;
                    
                    // Calcular valor total se as datas estiverem preenchidas
                    calcularValorTotal();
                });
            }
        } catch (error) {
            console.error('Erro ao carregar carros:', error);
        }
    }
    
    // Função para carregar locatários
    async function loadLocatarios() {
        try {
            const locatarios = await window.api.locatarios.listar();
            const locatarioSelect = document.getElementById('locatario');
            
            if (locatarioSelect && locatarios.length > 0) {
                locatarioSelect.innerHTML = '<option value="">Selecione um locatário</option>';
                
                locatarios.forEach(locatario => {
                    const option = document.createElement('option');
                    option.value = locatario.id;
                    option.textContent = `${locatario.nome_completo} (${locatario.cpf})`;
                    locatarioSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar locatários:', error);
        }
    }
    
    // Função para calcular o valor total da locação
    function calcularValorTotal() {
        const dataInicio = new Date(document.getElementById('data_inicio').value);
        const dataFim = new Date(document.getElementById('data_fim').value);
        const valorDiaria = parseFloat(document.getElementById('valor_diaria').value);
        
        if (!isNaN(dataInicio) && !isNaN(dataFim) && !isNaN(valorDiaria)) {
            const diffTime = Math.abs(dataFim - dataInicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const valorTotal = diffDays * valorDiaria;
            
            document.getElementById('valor_total').value = valorTotal.toFixed(2);
        }
    }
    
    // Adicionar eventos para recalcular o valor total quando as datas mudarem
    document.getElementById('data_inicio').addEventListener('change', calcularValorTotal);
    document.getElementById('data_fim').addEventListener('change', calcularValorTotal);
}

// Integração API - Avaliação
function setupAvaliacaoApi() {
    const form = document.getElementById('form-avaliacao');
    
    if (!form) return;
    
    // Carregar locações para o select
    loadLocacoes();
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validateForm(this)) {
            return;
        }
        
        try {
            const locacaoId = document.getElementById('locacao').value;
            
            // Avaliação da locadora sobre o locatário
            const avaliacaoLocadora = {
                locacao_id: locacaoId,
                nota: document.getElementById('nota_locadora').value,
                comentario: document.getElementById('comentario_locadora').value,
                valor_prejuizo: document.getElementById('valor_prejuizo').value || 0
            };
            
            // Avaliação do locatário sobre a locadora
            const avaliacaoLocatario = {
                locacao_id: locacaoId,
                nota: document.getElementById('nota_locatario').value,
                comentario: document.getElementById('comentario_locatario').value
            };
            
            // Registrar ambas as avaliações
            await window.api.avaliacoes.avaliarComoLocadora(avaliacaoLocadora);
            await window.api.avaliacoes.avaliarComoLocatario(avaliacaoLocatario);
            
            alert('Avaliações registradas com sucesso! A locação foi finalizada.');
            form.reset();
            
            // Recarregar locações
            loadLocacoes();
            
        } catch (error) {
            alert(`Erro ao registrar avaliações: ${error.message}`);
            console.error('Erro ao registrar avaliações:', error);
        }
    });
    
    // Função para carregar locações
    async function loadLocacoes() {
        try {
            const locacoes = await window.api.locacoes.listar();
            const locacaoSelect = document.getElementById('locacao');
            
            if (locacaoSelect) {
                // Filtrar apenas locações ativas
                const locacoesAtivas = locacoes.filter(locacao => locacao.status === 'ativa');
                
                locacaoSelect.innerHTML = '<option value="">Selecione uma locação</option>';
                
                locacoesAtivas.forEach(locacao => {
                    const option = document.createElement('option');
                    option.value = locacao.id;
                    option.textContent = `${locacao.locadora_nome} - ${locacao.locatario_nome} - ${locacao.marca} ${locacao.modelo} (${locacao.placa})`;
                    locacaoSelect.appendChild(option);
                });
                
                // Evento para carregar detalhes da locação quando selecionada
                locacaoSelect.addEventListener('change', async function() {
                    if (this.value) {
                        try {
                            const locacao = await window.api.locacoes.obter(this.value);
                            
                            // Preencher detalhes da locação
                            const detalhesContainer = document.getElementById('detalhes-locacao');
                            
                            if (detalhesContainer) {
                                detalhesContainer.innerHTML = `
                                    <p><strong>Locadora:</strong> ${locacao.locadora_nome}</p>
                                    <p><strong>Locatário:</strong> ${locacao.locatario_nome}</p>
                                    <p><strong>Veículo:</strong> ${locacao.marca} ${locacao.modelo} (${locacao.placa})</p>
                                    <p><strong>Período:</strong> ${formatDate(locacao.data_inicio)} a ${formatDate(locacao.data_fim)}</p>
                                    <p><strong>Valor Total:</strong> R$ ${parseFloat(locacao.valor_total).toFixed(2)}</p>
                                `;
                            }
                        } catch (error) {
                            console.error('Erro ao carregar detalhes da locação:', error);
                        }
                    } else {
                        document.getElementById('detalhes-locacao').innerHTML = '<p>Selecione uma locação para ver os detalhes.</p>';
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar locações:', error);
        }
    }
    
    // Função para formatar data
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
}

// Integração API - Consulta Pública
function setupConsultaApi() {
    const form = document.getElementById('form-consulta');
    
    if (!form) return;
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const termo = document.getElementById('termo_busca').value;
        const tipo = document.getElementById('tipo_busca').value;
        
        if (!termo) {
            alert('Por favor, informe um termo de busca.');
            return;
        }
        
        try {
            const resultados = await window.api.consulta.consultarReputacao(termo, tipo);
            
            // Exibir resultados
            const resultadosContainer = document.getElementById('resultados');
            
            if (resultadosContainer) {
                if (resultados.todos.length === 0) {
                    resultadosContainer.innerHTML = '<p>Nenhum resultado encontrado para a busca.</p>';
                    return;
                }
                
                let html = '';
                
                resultados.todos.forEach(resultado => {
                    const tipoLabel = resultado.tipo === 'locadora' ? 'Locadora' : 'Locatário';
                    const nome = resultado.tipo === 'locadora' ? resultado.razao_social || resultado.nome_fantasia : resultado.nome_completo;
                    const documento = resultado.tipo === 'locadora' ? resultado.cnpj : resultado.cpf;
                    
                    html += `
                        <div class="result-item">
                            <div class="result-header">
                                <div class="result-name">${nome}</div>
                                <div class="result-type">${tipoLabel}</div>
                            </div>
                            
                            <div class="result-stats">
                                <div class="stat-item">
                                    <div class="stat-value">${resultado.nota_media ? parseFloat(resultado.nota_media).toFixed(1) : 'N/A'}</div>
                                    <div class="stat-label">Nota Média</div>
                                </div>
                                
                                <div class="stat-item">
                                    <div class="stat-value">${resultado.total_avaliacoes || 0}</div>
                                    <div class="stat-label">Total de Avaliações</div>
                                </div>
                    `;
                    
                    if (resultado.tipo === 'locatario') {
                        html += `
                                <div class="stat-item">
                                    <div class="stat-value">R$ ${resultado.prejuizo_medio ? parseFloat(resultado.prejuizo_medio).toFixed(2) : '0,00'}</div>
                                    <div class="stat-label">Prejuízo Médio</div>
                                </div>
                        `;
                    }
                    
                    html += `</div>`;
                    
                    // Comentários
                    if (resultado.comentarios && resultado.comentarios.length > 0) {
                        html += `
                            <div class="result-comments">
                                <h4>Comentários Recentes</h4>
                        `;
                        
                        resultado.comentarios.forEach(comentario => {
                            html += `
                                <div class="comment-item">
                                    <div class="comment-rating">
                            `;
                            
                            // Estrelas
                            for (let i = 1; i <= 5; i++) {
                                html += `<i class="fas fa-star ${i <= comentario.nota ? 'filled' : ''}"></i>`;
                            }
                            
                            html += `
                                    </div>
                                    <div class="comment-text">
                                        "${comentario.comentario}"
                                    </div>
                            `;
                            
                            if (resultado.tipo === 'locatario' && comentario.valor_prejuizo > 0) {
                                html += `
                                    <div class="comment-damage" style="color: var(--danger-color); margin-top: 0.5rem;">
                                        Prejuízo registrado: R$ ${parseFloat(comentario.valor_prejuizo).toFixed(2)}
                                    </div>
                                `;
                            }
                            
                            html += `</div>`;
                        });
                        
                        html += `</div>`;
                    }
                    
                    html += `</div>`;
                });
                
                resultadosContainer.innerHTML = html;
            }
        } catch (error) {
            alert(`Erro ao realizar consulta: ${error.message}`);
            console.error('Erro ao realizar consulta:', error);
        }
    });
}

// Manter as funções originais abaixo
// Obter a página atual com base na URL
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    return page || 'index';
}

// Configurar validações de formulários
function setupFormValidations() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!validateForm(this)) {
                event.preventDefault();
            }
        });
        
        // Validação em tempo real para campos importantes
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
}

// Validar formulário completo
function validateForm(form) {
    let isValid = true;
    
    // Validar todos os campos obrigatórios
    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    // Validações específicas por tipo de formulário
    const formId = form.id;
    
    if (formId === 'form-locadora') {
        // Validar CNPJ
        const cnpjInput = form.querySelector('#cnpj');
        if (cnpjInput && !validateCNPJ(cnpjInput.value)) {
            showError(cnpjInput, 'CNPJ inválido');
            isValid = false;
        }
        
        // Validar CPF do responsável
        const cpfInput = form.querySelector('#responsavel_cpf');
        if (cpfInput && !validateCPF(cpfInput.value)) {
            showError(cpfInput, 'CPF inválido');
            isValid = false;
        }
    }
    
    if (formId === 'form-locatario') {
        // Validar CPF
        const cpfInput = form.querySelector('#cpf');
        if (cpfInput && !validateCPF(cpfInput.value)) {
            showError(cpfInput, 'CPF inválido');
            isValid = false;
        }
        
        // Validar CNH
        const cnhInput = form.querySelector('#cnh_numero');
        if (cnhInput && !validateCNH(cnhInput.value)) {
            showError(cnhInput, 'Número de CNH inválido');
            isValid = false;
        }
    }
    
    return isValid;
}

// Validar campo individual
function validateField(field) {
    // Remover mensagens de erro anteriores
    clearError(field);
    
    // Verificar se o campo está vazio
    if (field.hasAttribute('required') && !field.value.trim()) {
        showError(field, 'Este campo é obrigatório');
        return false;
    }
    
    // Validações específicas por tipo de campo
    const fieldType = field.getAttribute('type');
    const fieldId = field.id;
    
    if (fieldType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            showError(field, 'Email inválido');
            return false;
        }
    }
    
    if (fieldId === 'cnpj') {
        if (!validateCNPJ(field.value)) {
            showError(field, 'CNPJ inválido');
            return false;
        }
    }
    
    if (fieldId === 'cpf' || fieldId === 'responsavel_cpf') {
        if (!validateCPF(field.value)) {
            showError(field, 'CPF inválido');
            return false;
        }
    }
    
    return true;
}

// Mostrar mensagem de erro
function showError(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--danger-color)';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.classList.add('is-invalid');
    field.parentNode.appendChild(errorDiv);
}

// Limpar mensagem de erro
function clearError(field) {
    field.classList.remove('is-invalid');
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Validar CNPJ
function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    
    if (cnpj === '' || cnpj.length !== 14) {
        return false;
    }
    
    // Validação básica - implementação simplificada
    return true;
}

// Validar CPF
function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    
    if (cpf === '' || cpf.length !== 11) {
        return false;
    }
    
    // Validação básica - implementação simplificada
    return true;
}

// Validar CNH
function validateCNH(cnh) {
    cnh = cnh.replace(/[^\d]+/g, '');
    
    if (cnh === '' || cnh.length < 9 || cnh.length > 11) {
        return false;
    }
    
    // Validação básica - implementação simplificada
    return true;
}

// Configurar sistema de avaliação por estrelas
function setupStarRating() {
    const ratingContainers = document.querySelectorAll('.star-rating');
    
    ratingContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        const ratingInput = container.querySelector('input[type="hidden"]');
        
        stars.forEach((star, index) => {
            // Evento de hover
            star.addEventListener('mouseover', function() {
                // Preencher esta estrela e todas anteriores
                for (let i = 0; i <= index; i++) {
                    stars[i].classList.add('filled');
                }
            });
            
            star.addEventListener('mouseout', function() {
                // Remover preenchimento se não estiver selecionada
                const selectedRating = ratingInput.value;
                
                stars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.classList.add('filled');
                    } else {
                        s.classList.remove('filled');
                    }
                });
            });
            
            // Evento de clique
            star.addEventListener('click', function() {
                const rating = index + 1;
                ratingInput.value = rating;
                
                // Atualizar visual
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.classList.add('filled');
                    } else {
                        s.classList.remove('filled');
                    }
                });
            });
        });
    });
}

// Configurar upload de imagens
function setupImageUpload() {
    const imageUploadContainers = document.querySelectorAll('.image-upload-container');
    
    imageUploadContainers.forEach(container => {
        const previews = container.querySelectorAll('.image-preview');
        
        previews.forEach(preview => {
            preview.addEventListener('click', function() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.addEventListener('change', function(e) {
                    if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        
                        reader.onload = function(event) {
                            // Criar ou atualizar a imagem de preview
                            let img = preview.querySelector('img');
                            
                            if (!img) {
                                img = document.createElement('img');
                                preview.innerHTML = '';
                                preview.appendChild(img);
                            }
                            
                            img.src = event.target.result;
                            
                            // Adicionar botão de remoção
                            const removeBtn = document.createElement('button');
                            removeBtn.className = 'remove-image';
                            removeBtn.innerHTML = '&times;';
                            removeBtn.style.position = 'absolute';
                            removeBtn.style.top = '5px';
                            removeBtn.style.right = '5px';
                            removeBtn.style.backgroundColor = 'var(--danger-color)';
                            removeBtn.style.color = 'white';
                            removeBtn.style.border = 'none';
                            removeBtn.style.borderRadius = '50%';
                            removeBtn.style.width = '25px';
                            removeBtn.style.height = '25px';
                            removeBtn.style.cursor = 'pointer';
                            
                            removeBtn.addEventListener('click', function(e) {
                                e.stopPropagation();
                                preview.innerHTML = `
                                    <div class="image-preview-placeholder">
                                        <i class="fas fa-camera"></i>
                                        <div>Adicionar foto</div>
                                    </div>
                                `;
                            });
                            
                            preview.appendChild(removeBtn);
                        };
                        
                        reader.readAsDataURL(e.target.files[0]);
                    }
                });
                
                input.click();
            });
        });
    });
}

// Funções específicas para cada formulário
function setupLocadoraForm() {
    console.log('Formulário de Locadora inicializado');
    
    // Auto-preenchimento de endereço por CEP
    const cepInput = document.querySelector('#cep');
    if (cepInput) {
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                // Simulação de busca de CEP (em produção, usar API de CEP)
                console.log('Buscando CEP: ' + cep);
                // Preencher campos de endereço
            }
        });
    }
}

function setupLocatarioForm() {
    console.log('Formulário de Locatário inicializado');
    
    // Auto-preenchimento de endereço por CEP
    const cepInput = document.querySelector('#cep');
    if (cepInput) {
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                // Simulação de busca de CEP (em produção, usar API de CEP)
                console.log('Buscando CEP: ' + cep);
                // Preencher campos de endereço
            }
        });
    }
}

function setupCarroForm() {
    console.log('Formulário de Carro inicializado');
    
    // Validação de placa
    const placaInput = document.querySelector('#placa');
    if (placaInput) {
        placaInput.addEventListener('blur', function() {
            const placa = this.value.toUpperCase();
            const placaRegex = /^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;
            
            if (!placaRegex.test(placa)) {
                showError(this, 'Formato de placa inválido');
            }
        });
    }
}

function setupLocacaoForm() {
    console.log('Formulário de Locação inicializado');
    
    // Cálculo automático do valor total
    const dataInicioInput = document.querySelector('#data_inicio');
    const dataFimInput = document.querySelector('#data_fim');
    const valorDiariaInput = document.querySelector('#valor_diaria');
    const valorTotalInput = document.querySelector('#valor_total');
    
    if (dataInicioInput && dataFimInput && valorDiariaInput && valorTotalInput) {
        const calcularValorTotal = function() {
            const dataInicio = new Date(dataInicioInput.value);
            const dataFim = new Date(dataFimInput.value);
            const valorDiaria = parseFloat(valorDiariaInput.value);
            
            if (!isNaN(dataInicio) && !isNaN(dataFim) && !isNaN(valorDiaria)) {
                const diffTime = Math.abs(dataFim - dataInicio);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const valorTotal = diffDays * valorDiaria;
                
                valorTotalInput.value = valorTotal.toFixed(2);
            }
        };
        
        dataInicioInput.addEventListener('change', calcularValorTotal);
        dataFimInput.addEventListener('change', calcularValorTotal);
        valorDiariaInput.addEventListener('change', calcularValorTotal);
    }
    
    // Checkbox de locação retroativa
    const retroativaCheckbox = document.querySelector('#retroativa');
    if (retroativaCheckbox) {
        retroativaCheckbox.addEventListener('change', function() {
            // Lógica para locação retroativa
        });
    }
}

function setupAvaliacaoForm() {
    console.log('Formulário de Avaliação inicializado');
    
    // Verificar se ambas as avaliações foram preenchidas
    const formAvaliacao = document.querySelector('#form-avaliacao');
    
    if (formAvaliacao) {
        formAvaliacao.addEventListener('submit', function(event) {
            const notaLocadora = document.querySelector('#nota_locadora').value;
            const comentarioLocadora = document.querySelector('#comentario_locadora').value;
            const notaLocatario = document.querySelector('#nota_locatario').value;
            const comentarioLocatario = document.querySelector('#comentario_locatario').value;
            
            if (!notaLocadora || !comentarioLocadora || !notaLocatario || !comentarioLocatario) {
                event.preventDefault();
                alert('Ambas as avaliações devem ser preenchidas completamente.');
            }
        });
    }
}

function setupConsultaPublica() {
    console.log('Consulta Pública inicializada');
    
    // Formulário de busca
    const formBusca = document.querySelector('#form-consulta');
    
    if (formBusca) {
        formBusca.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const termoBusca = document.querySelector('#termo_busca').value;
            const tipoBusca = document.querySelector('#tipo_busca').value;
            
            if (termoBusca) {
                // Simulação de busca (em produção, fazer requisição ao backend)
                console.log('Buscando: ' + termoBusca + ' (Tipo: ' + tipoBusca + ')');
                // Exibir resultados
            }
        });
    }
}
