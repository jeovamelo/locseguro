const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de dados existe
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Caminho para o arquivo do banco de dados
const dbPath = path.join(dbDir, 'locseguro.db');

// Criar conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        initDatabase();
    }
});

// Inicializar o banco de dados com as tabelas necessárias
function initDatabase() {
    // Ler o arquivo SQL com o esquema do banco de dados
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o esquema em comandos SQL individuais
    const commands = schema.split(';').filter(cmd => cmd.trim() !== '');
    
    // Executar cada comando SQL
    db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON');
        
        commands.forEach(command => {
            db.run(command + ';', err => {
                if (err) {
                    console.error('Erro ao executar comando SQL:', err.message);
                    console.error('Comando:', command);
                }
            });
        });
        
        console.log('Banco de dados inicializado com sucesso');
    });
}

module.exports = db;
