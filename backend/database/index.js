const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'locseguro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

/**
 * Inicializa o banco de dados executando as migrações
 */
async function initDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    // Verificar se o banco de dados existe, se não, criar
    await createDatabaseIfNotExists();
    
    // Verificar se a tabela de migrações existe, se não, criar
    await createMigrationsTableIfNotExists();
    
    // Executar migrações pendentes
    await runPendingMigrations();
    
    console.log('Banco de dados inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    return false;
  }
}

/**
 * Cria o banco de dados se não existir
 */
async function createDatabaseIfNotExists() {
  try {
    // Conectar sem especificar o banco de dados
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    // Criar o banco de dados se não existir
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Fechar conexão temporária
    await tempPool.end();
    
    console.log(`Banco de dados '${dbConfig.database}' verificado/criado com sucesso`);
  } catch (error) {
    console.error('Erro ao criar banco de dados:', error);
    throw error;
  }
}

/**
 * Cria a tabela de migrações se não existir
 */
async function createMigrationsTableIfNotExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela de migrações verificada/criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar tabela de migrações:', error);
    throw error;
  }
}

/**
 * Executa as migrações pendentes
 */
async function runPendingMigrations() {
  try {
    // Obter migrações já executadas
    const [executedMigrations] = await pool.query('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(m => m.name);
    
    // Obter arquivos de migração
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // Ordenar para garantir a execução na ordem correta
    
    // Executar migrações pendentes
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Executando migração: ${file}`);
        
        // Importar arquivo de migração
        const migration = require(path.join(migrationsDir, file));
        
        // Executar migração
        await migration.up(pool);
        
        // Registrar migração como executada
        await pool.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        
        console.log(`Migração ${file} executada com sucesso`);
      }
    }
    
    console.log('Todas as migrações foram executadas');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  }
}

/**
 * Executa uma consulta no banco de dados
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parâmetros da consulta
 * @returns {Promise} - Resultado da consulta
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Erro ao executar consulta:', error);
    throw error;
  }
}

/**
 * Executa uma consulta e retorna um único resultado
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parâmetros da consulta
 * @returns {Promise} - Resultado da consulta
 */
async function queryOne(sql, params = []) {
  try {
    const results = await query(sql, params);
    return results[0];
  } catch (error) {
    console.error('Erro ao executar consulta:', error);
    throw error;
  }
}

/**
 * Insere um registro no banco de dados
 * @param {string} table - Nome da tabela
 * @param {Object} data - Dados a serem inseridos
 * @returns {Promise} - ID do registro inserido
 */
async function insert(table, data) {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    
    return result.insertId;
  } catch (error) {
    console.error(`Erro ao inserir em ${table}:`, error);
    throw error;
  }
}

/**
 * Atualiza um registro no banco de dados
 * @param {string} table - Nome da tabela
 * @param {Object} data - Dados a serem atualizados
 * @param {Object} where - Condição para atualização
 * @returns {Promise} - Número de registros afetados
 */
async function update(table, data, where) {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const [result] = await pool.query(sql, [...values, ...whereValues]);
    
    return result.affectedRows;
  } catch (error) {
    console.error(`Erro ao atualizar em ${table}:`, error);
    throw error;
  }
}

/**
 * Exclui um registro do banco de dados
 * @param {string} table - Nome da tabela
 * @param {Object} where - Condição para exclusão
 * @returns {Promise} - Número de registros afetados
 */
async function remove(table, where) {
  try {
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const [result] = await pool.query(sql, whereValues);
    
    return result.affectedRows;
  } catch (error) {
    console.error(`Erro ao excluir de ${table}:`, error);
    throw error;
  }
}

/**
 * Fecha a conexão com o banco de dados
 */
async function close() {
  try {
    await pool.end();
    console.log('Conexão com o banco de dados fechada');
  } catch (error) {
    console.error('Erro ao fechar conexão com o banco de dados:', error);
  }
}

module.exports = {
  initDatabase,
  query,
  queryOne,
  insert,
  update,
  remove,
  close,
  pool
};
