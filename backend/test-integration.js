#!/usr/bin/env node

/**
 * Script para testar a integração entre o frontend e o backend
 * Este script testa todas as principais funcionalidades do sistema LOC Seguro
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuração da API
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'locseguro',
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0
};

// Dados de teste
const testData = {
  locadora: {
    email: 'teste.locadora@exemplo.com',
    senha: 'Teste@2025',
    tipo: 'locadora',
    razao_social: 'Teste Locadora LTDA',
    nome_fantasia: 'Teste Locadora',
    cnpj: '12345678901234',
    inscricao_estadual: '123456789',
    cep: '12345678',
    rua: 'Rua de Teste',
    numero: '123',
    complemento: 'Sala 1',
    bairro: 'Bairro Teste',
    cidade: 'Cidade Teste',
    estado: 'TE',
    telefone_comercial: '1234567890',
    email_comercial: 'comercial@testelocadora.com',
    responsavel_nome: 'Responsável Teste',
    responsavel_cpf: '12345678901',
    responsavel_data_nascimento: '1980-01-01',
    responsavel_telefone: '1234567890',
    responsavel_email: 'responsavel@testelocadora.com'
  },
  locatario: {
    email: 'teste.locatario@exemplo.com',
    senha: 'Teste@2025',
    tipo: 'locatario',
    nome_completo: 'Locatário Teste',
    cpf: '12345678901',
    data_nascimento: '1990-01-01',
    telefone: '1234567890',
    email: 'teste.locatario@exemplo.com',
    cep: '12345678',
    rua: 'Rua de Teste',
    numero: '123',
    complemento: 'Apto 101',
    bairro: 'Bairro Teste',
    cidade: 'Cidade Teste',
    estado: 'TE',
    cnh_numero: '12345678901',
    cnh_categoria: 'B',
    cnh_data_emissao: '2015-01-01',
    cnh_validade: '2025-01-01',
    cnh_orgao_emissor: 'DETRAN',
    cnh_uf_emissao: 'TE'
  },
  carro: {
    marca: 'Marca Teste',
    modelo: 'Modelo Teste',
    ano_fabricacao: 2020,
    ano_modelo: 2021,
    cor: 'Preto',
    placa: 'ABC1234',
    chassi: '12345678901234567',
    quilometragem: 10000,
    valor_diaria: 100,
    observacoes: 'Carro de teste'
  },
  locacao: {
    data_inicio: '2025-05-01',
    data_fim: '2025-05-05',
    observacoes: 'Locação de teste'
  },
  avaliacao_locadora: {
    nota: 5,
    comentario: 'Ótimo locatário',
    valor_prejuizo: 0
  },
  avaliacao_locatario: {
    nota: 5,
    comentario: 'Ótima locadora'
  }
};

// Variáveis globais para armazenar IDs e tokens
const testIds = {
  locadora: null,
  locadora_token: null,
  locatario: null,
  locatario_token: null,
  carro: null,
  locacao: null,
  avaliacao_locadora: null,
  avaliacao_locatario: null
};

// Função para imprimir mensagens coloridas
const log = {
  info: (message) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${message}`),
  success: (message) => console.log('\x1b[32m%s\x1b[0m', `[SUCESSO] ${message}`),
  error: (message) => console.log('\x1b[31m%s\x1b[0m', `[ERRO] ${message}`),
  warning: (message) => console.log('\x1b[33m%s\x1b[0m', `[AVISO] ${message}`)
};

// Função para limpar o banco de dados de teste
async function limparBancoDados() {
  log.info('Limpando banco de dados de teste...');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Desativar verificação de chaves estrangeiras temporariamente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Limpar tabelas em ordem
    await connection.execute('DELETE FROM avaliacoes_locatario');
    await connection.execute('DELETE FROM avaliacoes_locadora');
    await connection.execute('DELETE FROM locacoes');
    await connection.execute('DELETE FROM fotos_carros');
    await connection.execute('DELETE FROM carros');
    await connection.execute('DELETE FROM locatarios');
    await connection.execute('DELETE FROM locadoras');
    await connection.execute('DELETE FROM sessoes');
    await connection.execute('DELETE FROM usuarios WHERE email LIKE "teste.%@exemplo.com"');
    
    // Reativar verificação de chaves estrangeiras
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    await connection.end();
    
    log.success('Banco de dados limpo com sucesso');
  } catch (error) {
    log.error(`Erro ao limpar banco de dados: ${error.message}`);
    throw error;
  }
}

// Função para testar o registro de locadora
async function testarRegistroLocadora() {
  log.info('Testando registro de locadora...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: testData.locadora.email,
      senha: testData.locadora.senha,
      tipo: testData.locadora.tipo
    });
    
    testIds.locadora_token = response.data.token;
    testIds.locadora = response.data.user.id;
    
    log.success(`Locadora registrada com sucesso. ID: ${testIds.locadora}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao registrar locadora: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o registro de locatário
async function testarRegistroLocatario() {
  log.info('Testando registro de locatário...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: testData.locatario.email,
      senha: testData.locatario.senha,
      tipo: testData.locatario.tipo
    });
    
    testIds.locatario_token = response.data.token;
    testIds.locatario = response.data.user.id;
    
    log.success(`Locatário registrado com sucesso. ID: ${testIds.locatario}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao registrar locatário: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o completar cadastro de locadora
async function testarCompletarCadastroLocadora() {
  log.info('Testando completar cadastro de locadora...');
  
  try {
    const response = await axios.post(`${API_URL}/locadoras`, testData.locadora, {
      headers: {
        'Authorization': `Bearer ${testIds.locadora_token}`
      }
    });
    
    log.success(`Cadastro de locadora completado com sucesso. ID: ${response.data.locadora_id}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao completar cadastro de locadora: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o completar cadastro de locatário
async function testarCompletarCadastroLocatario() {
  log.info('Testando completar cadastro de locatário...');
  
  try {
    const response = await axios.post(`${API_URL}/locatarios`, testData.locatario, {
      headers: {
        'Authorization': `Bearer ${testIds.locatario_token}`
      }
    });
    
    log.success(`Cadastro de locatário completado com sucesso. ID: ${response.data.locatario_id}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao completar cadastro de locatário: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o login de locadora
async function testarLoginLocadora() {
  log.info('Testando login de locadora...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testData.locadora.email,
      senha: testData.locadora.senha
    });
    
    testIds.locadora_token = response.data.token;
    
    log.success('Login de locadora realizado com sucesso');
    return response.data;
  } catch (error) {
    log.error(`Erro ao fazer login de locadora: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o login de locatário
async function testarLoginLocatario() {
  log.info('Testando login de locatário...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testData.locatario.email,
      senha: testData.locatario.senha
    });
    
    testIds.locatario_token = response.data.token;
    
    log.success('Login de locatário realizado com sucesso');
    return response.data;
  } catch (error) {
    log.error(`Erro ao fazer login de locatário: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o cadastro de carro
async function testarCadastroCarro() {
  log.info('Testando cadastro de carro...');
  
  try {
    const response = await axios.post(`${API_URL}/carros`, testData.carro, {
      headers: {
        'Authorization': `Bearer ${testIds.locadora_token}`
      }
    });
    
    testIds.carro = response.data.carro_id;
    
    log.success(`Carro cadastrado com sucesso. ID: ${testIds.carro}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao cadastrar carro: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar a listagem de carros
async function testarListagemCarros() {
  log.info('Testando listagem de carros...');
  
  try {
    const response = await axios.get(`${API_URL}/carros`);
    
    log.success(`Listagem de carros realizada com sucesso. Total: ${response.data.length}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao listar carros: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o cadastro de locação
async function testarCadastroLocacao() {
  log.info('Testando cadastro de locação...');
  
  try {
    // Obter IDs necessários
    const locadorasResponse = await axios.get(`${API_URL}/locadoras`);
    const locadora_id = locadorasResponse.data[0].id;
    
    const locatariosResponse = await axios.get(`${API_URL}/locatarios`);
    const locatario_id = locatariosResponse.data[0].id;
    
    // Dados da locação
    const locacaoData = {
      ...testData.locacao,
      carro_id: testIds.carro,
      locatario_id: locatario_id
    };
    
    const response = await axios.post(`${API_URL}/locacoes`, locacaoData, {
      headers: {
        'Authorization': `Bearer ${testIds.locadora_token}`
      }
    });
    
    testIds.locacao = response.data.locacao_id;
    
    log.success(`Locação cadastrada com sucesso. ID: ${testIds.locacao}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao cadastrar locação: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar a listagem de locações
async function testarListagemLocacoes() {
  log.info('Testando listagem de locações...');
  
  try {
    const response = await axios.get(`${API_URL}/locacoes`, {
      headers: {
        'Authorization': `Bearer ${testIds.locadora_token}`
      }
    });
    
    log.success(`Listagem de locações realizada com sucesso. Total: ${response.data.length}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao listar locações: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o cadastro de avaliação de locadora
async function testarCadastroAvaliacaoLocadora() {
  log.info('Testando cadastro de avaliação de locadora...');
  
  try {
    const avaliacaoData = {
      ...testData.avaliacao_locadora,
      locacao_id: testIds.locacao
    };
    
    const response = await axios.post(`${API_URL}/avaliacoes/locadora`, avaliacaoData, {
      headers: {
        'Authorization': `Bearer ${testIds.locadora_token}`
      }
    });
    
    testIds.avaliacao_locadora = response.data.avaliacao_id;
    
    log.success(`Avaliação de locadora cadastrada com sucesso. ID: ${testIds.avaliacao_locadora}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao cadastrar avaliação de locadora: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar o cadastro de avaliação de locatário
async function testarCadastroAvaliacaoLocatario() {
  log.info('Testando cadastro de avaliação de locatário...');
  
  try {
    const avaliacaoData = {
      ...testData.avaliacao_locatario,
      locacao_id: testIds.locacao
    };
    
    const response = await axios.post(`${API_URL}/avaliacoes/locatario`, avaliacaoData, {
      headers: {
        'Authorization': `Bearer ${testIds.locatario_token}`
      }
    });
    
    testIds.avaliacao_locatario = response.data.avaliacao_id;
    
    log.success(`Avaliação de locatário cadastrada com sucesso. ID: ${testIds.avaliacao_locatario}`);
    return response.data;
  } catch (error) {
    log.error(`Erro ao cadastrar avaliação de locatário: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar a consulta pública de locadora
async function testarConsultaPublicaLocadora() {
  log.info('Testando consulta pública de locadora...');
  
  try {
    // Obter ID da locadora
    const locadorasResponse = await axios.get(`${API_URL}/locadoras`);
    const locadora_id = locadorasResponse.data[0].id;
    
    const response = await axios.get(`${API_URL}/consulta/locadora/${locadora_id}`);
    
    log.success('Consulta pública de locadora realizada com sucesso');
    return response.data;
  } catch (error) {
    log.error(`Erro ao consultar locadora: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função para testar a consulta pública de locatário
async function testarConsultaPublicaLocatario() {
  log.info('Testando consulta pública de locatário...');
  
  try {
    // Obter ID do locatário
    const locatariosResponse = await axios.get(`${API_URL}/locatarios`);
    const locatario_id = locatariosResponse.data[0].id;
    
    const response = await axios.get(`${API_URL}/consulta/locatario/${locatario_id}`);
    
    log.success('Consulta pública de locatário realizada com sucesso');
    return response.data;
  } catch (error) {
    log.error(`Erro ao consultar locatário: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Função principal para executar todos os testes
async function executarTestes() {
  log.info('Iniciando testes de integração do sistema LOC Seguro...');
  
  try {
    // Limpar banco de dados de teste
    await limparBancoDados();
    
    // Testar autenticação
    await testarRegistroLocadora();
    await testarRegistroLocatario();
    await testarCompletarCadastroLocadora();
    await testarCompletarCadastroLocatario();
    await testarLoginLocadora();
    await testarLoginLocatario();
    
    // Testar funcionalidades
    await testarCadastroCarro();
    await testarListagemCarros();
    await testarCadastroLocacao();
    await testarListagemLocacoes();
    await testarCadastroAvaliacaoLocadora();
    await testarCadastroAvaliacaoLocatario();
    await testarConsultaPublicaLocadora();
    await testarConsultaPublicaLocatario();
    
    log.success('Todos os testes foram concluídos com sucesso!');
  } catch (error) {
    log.error(`Erro durante a execução dos testes: ${error.message}`);
    process.exit(1);
  }
}

// Executar testes
executarTestes();
