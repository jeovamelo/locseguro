// Modo de demonstração para quando o backend estiver indisponível
// Este arquivo implementa funcionalidades simuladas para permitir testes sem conexão com o backend

// Armazenamento local de dados
const demoStorage = {
  usuarios: [],
  locadoras: [],
  locatarios: [],
  carros: [],
  locacoes: [],
  avaliacoes: []
};

// Carregar dados de demonstração
function carregarDadosDemonstracao() {
  // Verificar se já temos dados carregados
  if (localStorage.getItem('demo_data')) {
    try {
      const demoData = JSON.parse(localStorage.getItem('demo_data'));
      Object.assign(demoStorage, demoData);
      console.log('Dados de demonstração carregados do localStorage');
    } catch (error) {
      console.error('Erro ao carregar dados de demonstração:', error);
      inicializarDadosDemonstracao();
    }
  } else {
    inicializarDadosDemonstracao();
  }
}

// Inicializar dados de demonstração
function inicializarDadosDemonstracao() {
  console.log('Inicializando dados de demonstração');
  
  // Limpar dados existentes
  demoStorage.usuarios = [];
  demoStorage.locadoras = [];
  demoStorage.locatarios = [];
  demoStorage.carros = [];
  demoStorage.locacoes = [];
  demoStorage.avaliacoes = [];
  
  // Adicionar locadoras de demonstração
  const locadoras = [
    {
      email: "locadora1@locseguro.com",
      senha: "Loc@2025Seguro1",
      nome_fantasia: "Auto Luxo Locadora",
      razao_social: "Auto Luxo Locações LTDA",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 98765-4321",
      endereco: "Av. Paulista, 1000, São Paulo - SP"
    },
    {
      email: "locadora2@locseguro.com",
      senha: "Loc@2025Seguro2",
      nome_fantasia: "Carros Já Locadora",
      razao_social: "Carros Já Locações LTDA",
      cnpj: "98.765.432/0001-10",
      telefone: "(21) 91234-5678",
      endereco: "Av. Atlântica, 500, Rio de Janeiro - RJ"
    }
  ];
  
  // Adicionar locatários de demonstração
  const locatarios = [
    {
      email: "locatario1@gmail.com",
      senha: "Loc@2025User1",
      nome: "João Silva",
      cpf: "123.456.789-00",
      telefone: "(11) 91234-5678",
      endereco: "Rua das Flores, 100, São Paulo - SP",
      cnh: "12345678900"
    },
    {
      email: "locatario2@gmail.com",
      senha: "Loc@2025User2",
      nome: "Maria Oliveira",
      cpf: "987.654.321-00",
      telefone: "(21) 98765-4321",
      endereco: "Rua do Mar, 200, Rio de Janeiro - RJ",
      cnh: "09876543210"
    },
    {
      email: "locatario3@gmail.com",
      senha: "Loc@2025User3",
      nome: "Pedro Santos",
      cpf: "111.222.333-44",
      telefone: "(31) 97777-8888",
      endereco: "Av. Central, 300, Belo Horizonte - MG",
      cnh: "11122233344"
    },
    {
      email: "locatario4@gmail.com",
      senha: "Loc@2025User4",
      nome: "Ana Souza",
      cpf: "444.555.666-77",
      telefone: "(41) 96666-7777",
      endereco: "Rua das Araucárias, 400, Curitiba - PR",
      cnh: "44455566677"
    },
    {
      email: "locatario5@gmail.com",
      senha: "Loc@2025User5",
      nome: "Carlos Ferreira",
      cpf: "555.666.777-88",
      telefone: "(51) 95555-6666",
      endereco: "Av. Ipiranga, 500, Porto Alegre - RS",
      cnh: "55566677788"
    },
    {
      email: "locatario6@gmail.com",
      senha: "Loc@2025User6",
      nome: "Lúcia Pereira",
      cpf: "666.777.888-99",
      telefone: "(81) 94444-5555",
      endereco: "Rua da Praia, 600, Recife - PE",
      cnh: "66677788899"
    }
  ];
  
  // Adicionar locadoras de demonstração
  locadoras.forEach(locadora => {
    const id = demoStorage.usuarios.length + 1;
    
    // Adicionar usuário
    demoStorage.usuarios.push({
      id,
      email: locadora.email,
      senha: locadora.senha,
      tipo: 'locadora',
      cadastro_completo: true
    });
    
    // Adicionar locadora
    demoStorage.locadoras.push({
      id,
      usuario_id: id,
      nome_fantasia: locadora.nome_fantasia,
      razao_social: locadora.razao_social,
      cnpj: locadora.cnpj,
      telefone: locadora.telefone,
      endereco: locadora.endereco,
      avaliacao_media: 4.5,
      total_avaliacoes: 10
    });
  });
  
  // Adicionar locatários de demonstração
  locatarios.forEach(locatario => {
    const id = demoStorage.usuarios.length + 1;
    
    // Adicionar usuário
    demoStorage.usuarios.push({
      id,
      email: locatario.email,
      senha: locatario.senha,
      tipo: 'locatario',
      cadastro_completo: true
    });
    
    // Adicionar locatário
    demoStorage.locatarios.push({
      id,
      usuario_id: id,
      nome: locatario.nome,
      cpf: locatario.cpf,
      telefone: locatario.telefone,
      endereco: locatario.endereco,
      cnh: locatario.cnh,
      avaliacao_media: 4.2,
      total_avaliacoes: 5
    });
  });
  
  // Adicionar alguns carros de demonstração
  const carrosDemo = [
    {
      id: 1,
      locadora_id: 1,
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      placa: 'ABC1234',
      cor: 'Prata',
      quilometragem: 15000,
      valor_diaria: 150.00,
      disponivel: true
    },
    {
      id: 2,
      locadora_id: 1,
      marca: 'Honda',
      modelo: 'Civic',
      ano: 2022,
      placa: 'DEF5678',
      cor: 'Preto',
      quilometragem: 25000,
      valor_diaria: 140.00,
      disponivel: true
    },
    {
      id: 3,
      locadora_id: 2,
      marca: 'Volkswagen',
      modelo: 'Golf',
      ano: 2021,
      placa: 'GHI9012',
      cor: 'Branco',
      quilometragem: 30000,
      valor_diaria: 130.00,
      disponivel: true
    },
    {
      id: 4,
      locadora_id: 2,
      marca: 'Fiat',
      modelo: 'Pulse',
      ano: 2023,
      placa: 'JKL3456',
      cor: 'Vermelho',
      quilometragem: 10000,
      valor_diaria: 120.00,
      disponivel: true
    }
  ];
  
  demoStorage.carros = carrosDemo;
  
  // Salvar dados no localStorage
  salvarDadosDemonstracao();
}

// Salvar dados de demonstração no localStorage
function salvarDadosDemonstracao() {
  try {
    localStorage.setItem('demo_data', JSON.stringify(demoStorage));
    console.log('Dados de demonstração salvos no localStorage');
  } catch (error) {
    console.error('Erro ao salvar dados de demonstração:', error);
  }
}

// Adicionar indicador de modo de demonstração
function adicionarIndicadorModoDemo() {
  // Remover indicador existente, se houver
  const indicadorExistente = document.querySelector('.demo-mode-indicator');
  if (indicadorExistente) {
    indicadorExistente.remove();
  }
  
  // Criar novo indicador
  const indicador = document.createElement('div');
  indicador.className = 'demo-mode-indicator';
  indicador.textContent = 'MODO DEMONSTRAÇÃO';
  document.body.appendChild(indicador);
}

// API de demonstração
window.demoApi = {
  // Verificar se o modo de demonstração está ativo
  isActive: false,
  
  // Ativar modo de demonstração
  ativar: function() {
    this.isActive = true;
    carregarDadosDemonstracao();
    adicionarIndicadorModoDemo();
    console.log('Modo de demonstração ativado');
    return true;
  },
  
  // Desativar modo de demonstração
  desativar: function() {
    this.isActive = false;
    const indicador = document.querySelector('.demo-mode-indicator');
    if (indicador) {
      indicador.remove();
    }
    console.log('Modo de demonstração desativado');
    return true;
  },
  
  // Autenticação
  auth: {
    // Registrar novo usuário
    registrar: function(email, senha, tipo) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Verificar se o email já existe
          const usuarioExistente = demoStorage.usuarios.find(u => u.email === email);
          if (usuarioExistente) {
            reject({ message: 'Este email já está em uso' });
            return;
          }
          
          // Criar novo usuário
          const id = demoStorage.usuarios.length + 1;
          const novoUsuario = {
            id,
            email,
            senha,
            tipo,
            cadastro_completo: false
          };
          
          demoStorage.usuarios.push(novoUsuario);
          salvarDadosDemonstracao();
          
          // Gerar token fictício
          const token = `demo_token_${Date.now()}_${id}`;
          
          resolve({
            success: true,
            message: 'Usuário registrado com sucesso',
            data: {
              token,
              usuario_id: id,
              email,
              tipo,
              cadastro_completo: false
            }
          });
        }, 500); // Simular delay de rede
      });
    },
    
    // Login de usuário
    login: function(email, senha) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('Tentando login no modo demo com:', email, senha);
          console.log('Usuários disponíveis:', demoStorage.usuarios);
          
          // Buscar usuário pelo email
          const usuario = demoStorage.usuarios.find(u => u.email === email);
          
          if (!usuario) {
            reject({ message: 'Usuário não encontrado' });
            return;
          }
          
          if (usuario.senha !== senha) {
            reject({ message: 'Senha incorreta' });
            return;
          }
          
          // Gerar token fictício
          const token = `demo_token_${Date.now()}_${usuario.id}`;
          
          resolve({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
              token,
              usuario_id: usuario.id,
              email: usuario.email,
              tipo: usuario.tipo,
              cadastro_completo: usuario.cadastro_completo
            }
          });
        }, 500); // Simular delay de rede
      });
    },
    
    // Completar cadastro de locadora
    completarCadastroLocadora: function(formData, token) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Extrair ID do usuário do token
          const tokenParts = token.split('_');
          const usuarioId = parseInt(tokenParts[2]);
          
          // Buscar usuário pelo ID
          const usuario = demoStorage.usuarios.find(u => u.id === usuarioId);
          
          if (!usuario) {
            reject({ message: 'Usuário não encontrado' });
            return;
          }
          
          if (usuario.tipo !== 'locadora') {
            reject({ message: 'Tipo de usuário inválido' });
            return;
          }
          
          // Atualizar status de cadastro completo
          usuario.cadastro_completo = true;
          
          // Criar registro de locadora
          const novaLocadora = {
            id: demoStorage.locadoras.length + 1,
            usuario_id: usuarioId,
            nome_fantasia: formData.nome_fantasia,
            razao_social: formData.razao_social,
            cnpj: formData.cnpj,
            telefone: formData.telefone,
            endereco: formData.endereco,
            avaliacao_media: 0,
            total_avaliacoes: 0
          };
          
          demoStorage.locadoras.push(novaLocadora);
          salvarDadosDemonstracao();
          
          resolve({
            success: true,
            message: 'Cadastro de locadora completado com sucesso',
            data: {
              locadora_id: novaLocadora.id
            }
          });
        }, 500); // Simular delay de rede
      });
    },
    
    // Completar cadastro de locatário
    completarCadastroLocatario: function(formData, token) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Extrair ID do usuário do token
          const tokenParts = token.split('_');
          const usuarioId = parseInt(tokenParts[2]);
          
          // Buscar usuário pelo ID
          const usuario = demoStorage.usuarios.find(u => u.id === usuarioId);
          
          if (!usuario) {
            reject({ message: 'Usuário não encontrado' });
            return;
          }
          
          if (usuario.tipo !== 'locatario') {
            reject({ message: 'Tipo de usuário inválido' });
            return;
          }
          
          // Atualizar status de cadastro completo
          usuario.cadastro_completo = true;
          
          // Criar registro de locatário
          const novoLocatario = {
            id: demoStorage.locatarios.length + 1,
            usuario_id: usuarioId,
            nome: formData.nome,
            cpf: formData.cpf,
            telefone: formData.telefone,
            endereco: formData.endereco,
            cnh: formData.cnh,
            avaliacao_media: 0,
            total_avaliacoes: 0
          };
          
          demoStorage.locatarios.push(novoLocatario);
          salvarDadosDemonstracao();
          
          resolve({
            success: true,
            message: 'Cadastro de locatário completado com sucesso',
            data: {
              locatario_id: novoLocatario.id
            }
          });
        }, 500); // Simular delay de rede
      });
    }
  }
};

// Inicializar modo de demonstração quando o arquivo for carregado
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando modo de demonstração...');
  // Carregar dados de demonstração para estarem prontos quando necessário
  carregarDadosDemonstracao();
});
