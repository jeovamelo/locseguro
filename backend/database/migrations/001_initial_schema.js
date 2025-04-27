const fs = require('fs');
const path = require('path');

/**
 * Migração inicial para criar o esquema do banco de dados
 * @param {Object} db - Instância do banco de dados
 * @returns {Promise} - Promise que resolve quando a migração for concluída
 */
exports.up = function(db) {
  return new Promise((resolve, reject) => {
    console.log('Executando migração inicial do esquema...');
    
    // Ler o arquivo SQL com o esquema combinado
    const schemaPath = path.join(__dirname, '../schema_combined.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o esquema em comandos SQL individuais
    const commands = schema.split(';').filter(cmd => cmd.trim() !== '');
    
    // Executar cada comando SQL
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      
      let success = true;
      
      commands.forEach(command => {
        db.run(command + ';', err => {
          if (err) {
            console.error('Erro ao executar comando SQL:', err.message);
            console.error('Comando:', command);
            success = false;
          }
        });
      });
      
      if (success) {
        console.log('Migração inicial do esquema concluída com sucesso');
        resolve();
      } else {
        console.error('Falha na migração inicial do esquema');
        reject(new Error('Falha na migração inicial do esquema'));
      }
    });
  });
};

/**
 * Reverter a migração inicial
 * @param {Object} db - Instância do banco de dados
 * @returns {Promise} - Promise que resolve quando a reversão for concluída
 */
exports.down = function(db) {
  return new Promise((resolve, reject) => {
    console.log('Revertendo migração inicial do esquema...');
    
    // Lista de tabelas para excluir na ordem correta (inversa das dependências)
    const tables = [
      'tipo_usuario_permissoes',
      'permissoes',
      'sessoes',
      'avaliacoes_locatario',
      'avaliacoes_locadora',
      'locacoes',
      'fotos_carros',
      'carros',
      'locatarios',
      'locadoras',
      'usuarios'
    ];
    
    // Excluir cada tabela
    db.serialize(() => {
      let success = true;
      
      tables.forEach(table => {
        db.run(`DROP TABLE IF EXISTS ${table}`, err => {
          if (err) {
            console.error(`Erro ao excluir tabela ${table}:`, err.message);
            success = false;
          }
        });
      });
      
      if (success) {
        console.log('Reversão da migração inicial concluída com sucesso');
        resolve();
      } else {
        console.error('Falha na reversão da migração inicial');
        reject(new Error('Falha na reversão da migração inicial'));
      }
    });
  });
};
