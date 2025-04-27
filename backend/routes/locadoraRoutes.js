const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obter todas as locadoras
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM locadoras WHERE ativo = 1';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar locadoras:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar locadoras' });
        }
        
        res.json({ success: true, data: rows });
    });
});

// Obter uma locadora específica
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM locadoras WHERE id = ? AND ativo = 1';
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar locadora:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar locadora' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locadora não encontrada' });
        }
        
        res.json({ success: true, data: row });
    });
});

// Criar uma nova locadora
router.post('/', (req, res) => {
    const {
        razao_social, nome_fantasia, cnpj, inscricao_estadual,
        cep, rua, numero, complemento, bairro, cidade, estado,
        telefone_comercial, email_comercial,
        responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
        responsavel_telefone, responsavel_email
    } = req.body;
    
    // Verificar se o CNPJ já existe
    db.get('SELECT id FROM locadoras WHERE cnpj = ?', [cnpj], (err, row) => {
        if (err) {
            console.error('Erro ao verificar CNPJ:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar CNPJ' });
        }
        
        if (row) {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        
        // Inserir nova locadora
        const sql = `
            INSERT INTO locadoras (
                razao_social, nome_fantasia, cnpj, inscricao_estadual,
                cep, rua, numero, complemento, bairro, cidade, estado,
                telefone_comercial, email_comercial,
                responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
                responsavel_telefone, responsavel_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [
            razao_social, nome_fantasia, cnpj, inscricao_estadual,
            cep, rua, numero, complemento, bairro, cidade, estado,
            telefone_comercial, email_comercial,
            responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
            responsavel_telefone, responsavel_email
        ], function(err) {
            if (err) {
                console.error('Erro ao cadastrar locadora:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao cadastrar locadora' });
            }
            
            res.status(201).json({ 
                success: true, 
                message: 'Locadora cadastrada com sucesso',
                data: { id: this.lastID }
            });
        });
    });
});

// Atualizar uma locadora
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const {
        razao_social, nome_fantasia, inscricao_estadual,
        cep, rua, numero, complemento, bairro, cidade, estado,
        telefone_comercial, email_comercial,
        responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
        responsavel_telefone, responsavel_email
    } = req.body;
    
    // Verificar se a locadora existe
    db.get('SELECT id FROM locadoras WHERE id = ? AND ativo = 1', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar locadora:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar locadora' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locadora não encontrada' });
        }
        
        // Atualizar locadora
        const sql = `
            UPDATE locadoras SET
                razao_social = ?, nome_fantasia = ?, inscricao_estadual = ?,
                cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?,
                telefone_comercial = ?, email_comercial = ?,
                responsavel_nome = ?, responsavel_cpf = ?, responsavel_data_nascimento = ?,
                responsavel_telefone = ?, responsavel_email = ?
            WHERE id = ?
        `;
        
        db.run(sql, [
            razao_social, nome_fantasia, inscricao_estadual,
            cep, rua, numero, complemento, bairro, cidade, estado,
            telefone_comercial, email_comercial,
            responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
            responsavel_telefone, responsavel_email,
            id
        ], function(err) {
            if (err) {
                console.error('Erro ao atualizar locadora:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar locadora' });
            }
            
            res.json({ 
                success: true, 
                message: 'Locadora atualizada com sucesso'
            });
        });
    });
});

// Desativar uma locadora (exclusão lógica)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    // Verificar se a locadora existe
    db.get('SELECT id FROM locadoras WHERE id = ? AND ativo = 1', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar locadora:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar locadora' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locadora não encontrada' });
        }
        
        // Desativar locadora
        const sql = 'UPDATE locadoras SET ativo = 0 WHERE id = ?';
        
        db.run(sql, [id], function(err) {
            if (err) {
                console.error('Erro ao desativar locadora:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao desativar locadora' });
            }
            
            res.json({ 
                success: true, 
                message: 'Locadora desativada com sucesso'
            });
        });
    });
});

module.exports = router;
