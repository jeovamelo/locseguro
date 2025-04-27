const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obter todos os locatários
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM locatarios WHERE ativo = 1';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar locatários:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar locatários' });
        }
        
        res.json({ success: true, data: rows });
    });
});

// Obter um locatário específico
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM locatarios WHERE id = ? AND ativo = 1';
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar locatário:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar locatário' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locatário não encontrado' });
        }
        
        res.json({ success: true, data: row });
    });
});

// Criar um novo locatário
router.post('/', (req, res) => {
    const {
        nome_completo, cpf, data_nascimento, telefone, email,
        cep, rua, numero, complemento, bairro, cidade, estado,
        cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
        cnh_orgao_emissor, cnh_uf_emissao
    } = req.body;
    
    // Verificar se o CPF já existe
    db.get('SELECT id FROM locatarios WHERE cpf = ?', [cpf], (err, row) => {
        if (err) {
            console.error('Erro ao verificar CPF:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar CPF' });
        }
        
        if (row) {
            return res.status(400).json({ success: false, message: 'CPF já cadastrado' });
        }
        
        // Verificar se o número da CNH já existe
        db.get('SELECT id FROM locatarios WHERE cnh_numero = ?', [cnh_numero], (err, row) => {
            if (err) {
                console.error('Erro ao verificar CNH:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao verificar CNH' });
            }
            
            if (row) {
                return res.status(400).json({ success: false, message: 'CNH já cadastrada' });
            }
            
            // Inserir novo locatário
            const sql = `
                INSERT INTO locatarios (
                    nome_completo, cpf, data_nascimento, telefone, email,
                    cep, rua, numero, complemento, bairro, cidade, estado,
                    cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
                    cnh_orgao_emissor, cnh_uf_emissao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [
                nome_completo, cpf, data_nascimento, telefone, email,
                cep, rua, numero, complemento, bairro, cidade, estado,
                cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
                cnh_orgao_emissor, cnh_uf_emissao
            ], function(err) {
                if (err) {
                    console.error('Erro ao cadastrar locatário:', err.message);
                    return res.status(500).json({ success: false, message: 'Erro ao cadastrar locatário' });
                }
                
                res.status(201).json({ 
                    success: true, 
                    message: 'Locatário cadastrado com sucesso',
                    data: { id: this.lastID }
                });
            });
        });
    });
});

// Atualizar um locatário
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const {
        nome_completo, data_nascimento, telefone, email,
        cep, rua, numero, complemento, bairro, cidade, estado,
        cnh_categoria, cnh_data_emissao, cnh_validade,
        cnh_orgao_emissor, cnh_uf_emissao
    } = req.body;
    
    // Verificar se o locatário existe
    db.get('SELECT id FROM locatarios WHERE id = ? AND ativo = 1', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar locatário:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar locatário' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locatário não encontrado' });
        }
        
        // Atualizar locatário
        const sql = `
            UPDATE locatarios SET
                nome_completo = ?, data_nascimento = ?, telefone = ?, email = ?,
                cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?,
                cnh_categoria = ?, cnh_data_emissao = ?, cnh_validade = ?,
                cnh_orgao_emissor = ?, cnh_uf_emissao = ?
            WHERE id = ?
        `;
        
        db.run(sql, [
            nome_completo, data_nascimento, telefone, email,
            cep, rua, numero, complemento, bairro, cidade, estado,
            cnh_categoria, cnh_data_emissao, cnh_validade,
            cnh_orgao_emissor, cnh_uf_emissao,
            id
        ], function(err) {
            if (err) {
                console.error('Erro ao atualizar locatário:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar locatário' });
            }
            
            res.json({ 
                success: true, 
                message: 'Locatário atualizado com sucesso'
            });
        });
    });
});

// Desativar um locatário (exclusão lógica)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    // Verificar se o locatário existe
    db.get('SELECT id FROM locatarios WHERE id = ? AND ativo = 1', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar locatário:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar locatário' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locatário não encontrado' });
        }
        
        // Desativar locatário
        const sql = 'UPDATE locatarios SET ativo = 0 WHERE id = ?';
        
        db.run(sql, [id], function(err) {
            if (err) {
                console.error('Erro ao desativar locatário:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao desativar locatário' });
            }
            
            res.json({ 
                success: true, 
                message: 'Locatário desativado com sucesso'
            });
        });
    });
});

module.exports = router;
