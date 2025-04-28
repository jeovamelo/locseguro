// Script para criar contas fictícias para teste
// Este script cria 2 locadoras e 6 locatários para teste

// Dados das locadoras
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

// Dados dos locatários
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

// Função para criar as contas
async function criarContasFicticias() {
  const API_URL = 'http://3000-ijxwfwvnyu523t66vmw52-13f789e2.manus.computer/api';
  const resultados = [];
  
  // Criar locadoras
  console.log("Criando contas de locadoras...");
  for (const locadora of locadoras) {
    try {
      // Registrar usuário
      const responseRegistro = await fetch(`${API_URL}/auth/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: locadora.email,
          senha: locadora.senha,
          tipo: 'locadora'
        })
      });
      
      if (!responseRegistro.ok) {
        const errorData = await responseRegistro.json();
        console.error(`Erro ao registrar locadora ${locadora.email}:`, errorData.message);
        resultados.push({
          tipo: 'locadora',
          email: locadora.email,
          status: 'erro',
          mensagem: errorData.message
        });
        continue;
      }
      
      const dataRegistro = await responseRegistro.json();
      
      // Completar cadastro
      const responseCompletar = await fetch(`${API_URL}/auth/completar-cadastro/locadora`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataRegistro.data.token}`
        },
        body: JSON.stringify({
          nome_fantasia: locadora.nome_fantasia,
          razao_social: locadora.razao_social,
          cnpj: locadora.cnpj,
          telefone: locadora.telefone,
          endereco: locadora.endereco
        })
      });
      
      if (!responseCompletar.ok) {
        const errorData = await responseCompletar.json();
        console.error(`Erro ao completar cadastro da locadora ${locadora.email}:`, errorData.message);
        resultados.push({
          tipo: 'locadora',
          email: locadora.email,
          status: 'erro',
          mensagem: errorData.message
        });
        continue;
      }
      
      console.log(`Locadora ${locadora.email} criada com sucesso!`);
      resultados.push({
        tipo: 'locadora',
        email: locadora.email,
        senha: locadora.senha,
        cnpj: locadora.cnpj,
        nome_fantasia: locadora.nome_fantasia,
        status: 'sucesso'
      });
    } catch (error) {
      console.error(`Erro ao criar locadora ${locadora.email}:`, error.message);
      resultados.push({
        tipo: 'locadora',
        email: locadora.email,
        status: 'erro',
        mensagem: error.message
      });
    }
  }
  
  // Criar locatários
  console.log("Criando contas de locatários...");
  for (const locatario of locatarios) {
    try {
      // Registrar usuário
      const responseRegistro = await fetch(`${API_URL}/auth/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: locatario.email,
          senha: locatario.senha,
          tipo: 'locatario'
        })
      });
      
      if (!responseRegistro.ok) {
        const errorData = await responseRegistro.json();
        console.error(`Erro ao registrar locatário ${locatario.email}:`, errorData.message);
        resultados.push({
          tipo: 'locatario',
          email: locatario.email,
          status: 'erro',
          mensagem: errorData.message
        });
        continue;
      }
      
      const dataRegistro = await responseRegistro.json();
      
      // Completar cadastro
      const responseCompletar = await fetch(`${API_URL}/auth/completar-cadastro/locatario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataRegistro.data.token}`
        },
        body: JSON.stringify({
          nome: locatario.nome,
          cpf: locatario.cpf,
          telefone: locatario.telefone,
          endereco: locatario.endereco,
          cnh: locatario.cnh
        })
      });
      
      if (!responseCompletar.ok) {
        const errorData = await responseCompletar.json();
        console.error(`Erro ao completar cadastro do locatário ${locatario.email}:`, errorData.message);
        resultados.push({
          tipo: 'locatario',
          email: locatario.email,
          status: 'erro',
          mensagem: errorData.message
        });
        continue;
      }
      
      console.log(`Locatário ${locatario.email} criado com sucesso!`);
      resultados.push({
        tipo: 'locatario',
        email: locatario.email,
        senha: locatario.senha,
        cpf: locatario.cpf,
        nome: locatario.nome,
        status: 'sucesso'
      });
    } catch (error) {
      console.error(`Erro ao criar locatário ${locatario.email}:`, error.message);
      resultados.push({
        tipo: 'locatario',
        email: locatario.email,
        status: 'erro',
        mensagem: error.message
      });
    }
  }
  
  return resultados;
}

// Exportar dados para uso em outros scripts
window.contasFicticias = {
  locadoras,
  locatarios,
  criarContas: criarContasFicticias
};
