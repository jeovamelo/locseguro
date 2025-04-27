const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obter todas as locações
router.get('/', (req, res) => {
    const sql = `
        SELECT l.*, 
               c.marca, c.modelo, c.placa,
               loc.razao_social as locadora_nome,
               lt.nome_completo as locatario_nome
        FROM locacoes l
        JOIN carros c ON l.carro_id = c.id
        JOIN locadoras loc ON l.locadora_id = loc.id
        JOIN locatarios lt ON l.locatario_id = lt.id
        ORDER BY l.data_inicio DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar locações:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar locações' });
        }
        
        res.json({ success: true, data: rows });
    });
});

// Obter uma locação específica
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT l.*, 
               c.marca, c.modelo, c.placa,
               loc.razao_social as locadora_nome,
               lt.nome_completo as locatario_nome
        FROM locacoes l
        JOIN carros c ON l.carro_id = c.id
        JOIN locadoras loc ON l.locadora_id = loc.id
        JOIN locatarios lt ON l.locatario_id = lt.id
        WHERE l.id = ?
    `;
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar locação:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar locação' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locação não encontrada' });
        }
        
        // Verificar se existem avaliações para esta locação
        const avaliacaoSql = `
            SELECT 
                al.nota as nota_locadora, al.comentario as comentario_locadora, al.valor_prejuizo,
                at.nota as nota_locatario, at.comentario as comentario_locatario
            FROM locacoes l
            LEFT JOIN avaliacoes_locadora al ON l.id = al.locacao_id
            LEFT JOIN avaliacoes_locatario at ON l.id = at.locacao_id
            WHERE l.id = ?
        `;
        
        db.get(avaliacaoSql, [id], (err, avaliacao) => {
            if (err) {
                console.error('Erro ao buscar avaliações:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao buscar avaliações' });
            }
            
            row.avaliacao = avaliacao || null;
            res.json({ success: true, data: row });
        });
    });
});

// Criar uma nova locação
router.post('/', (req, res) => {
    const {
        carro_id, locadora_id, locatario_id,
        data_inicio, data_fim, valor_total,
        observacoes, retroativa
    } = req.body;
    
    // Verificar se o carro existe e está disponível
    db.get('SELECT id FROM carros WHERE id = ? AND disponivel = 1', [carro_id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar carro:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar carro' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Carro não encontrado ou indisponível' });
        }
        
        // Verificar se a locadora existe
        db.get('SELECT id FROM locadoras WHERE id = ? AND ativo = 1', [locadora_id], (err, row) => {
            if (err) {
                console.error('Erro ao verificar locadora:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao verificar locadora' });
            }
            
            if (!row) {
                return res.status(404).json({ success: false, message: 'Locadora não encontrada' });
            }
            
            // Verificar se o locatário existe
            db.get('SELECT id FROM locatarios WHERE id = ? AND ativo = 1', [locatario_id], (err, row) => {
                if (err) {
                    console.error('Erro ao verificar locatário:', err.message);
                    return res.status(500).json({ success: false, message: 'Erro ao verificar locatário' });
                }
                
                if (!row) {
                    return res.status(404).json({ success: false, message: 'Locatário não encontrado' });
                }
                
                // Verificar se o carro já está locado no período solicitado
                const verificaDisponibilidadeSql = `
                    SELECT id FROM locacoes
                    WHERE carro_id = ? AND status = 'ativa'
                    AND (
                        (data_inicio <= ? AND data_fim >= ?) OR
                        (data_inicio <= ? AND data_fim >= ?) OR
                        (data_inicio >= ? AND data_fim <= ?)
                    )
                `;
                
                db.get(verificaDisponibilidadeSql, [
                    carro_id, 
                    data_inicio, data_inicio, 
                    data_fim, data_fim,
                    data_inicio, data_fim
                ], (err, row) => {
                    if (err) {
                        console.error('Erro ao verificar disponibilidade:', err.message);
                        return res.status(500).json({ success: false, message: 'Erro ao verificar disponibilidade' });
                    }
                    
                    if (row && !retroativa) {
                        return res.status(400).json({ success: false, message: 'Carro já está locado no período solicitado' });
                    }
                    
                    // Inserir nova locação
                    const sql = `
                        INSERT INTO locacoes (
                            carro_id, locadora_id, locatario_id,
                            data_inicio, data_fim, valor_total,
                            observacoes, retroativa, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.run(sql, [
                        carro_id, locadora_id, locatario_id,
                        data_inicio, data_fim, valor_total,
                        observacoes, retroativa ? 1 : 0, 'ativa'
                    ], function(err) {
                        if (err) {
                            console.error('Erro ao cadastrar locação:', err.message);
                            return res.status(500).json({ success: false, message: 'Erro ao cadastrar locação' });
                        }
                        
                        res.status(201).json({ 
                            success: true, 
                            message: 'Locação cadastrada com sucesso',
                            data: { id: this.lastID }
                        });
                    });
                });
            });
        });
    });
});

// Atualizar uma locação
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const {
        data_inicio, data_fim, valor_total,
        observacoes, status
    } = req.body;
    
    // Verificar se a locação existe
    db.get('SELECT id, status FROM locacoes WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar locação:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar locação' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locação não encontrada' });
        }
        
        // Verificar se a locação já foi finalizada
        if (row.status === 'finalizada' && status !== 'finalizada') {
            return res.status(400).json({ success: false, message: 'Não é possível alterar uma locação finalizada' });
        }
        
        // Atualizar locação
        const sql = `
            UPDATE locacoes SET
                data_inicio = ?, data_fim = ?, valor_total = ?,
                observacoes = ?, status = ?
            WHERE id = ?
        `;
        
        db.run(sql, [
            data_inicio, data_fim, valor_total,
            observacoes, status,
            id
        ], function(err) {
            if (err) {
                console.error('Erro ao atualizar locação:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar locação' });
            }
            
            res.json({ 
                success: true, 
                message: 'Locação atualizada com sucesso'
            });
        });
    });
});

// Cancelar uma locação
router.post('/:id/cancelar', (req, res) => {
    const id = req.params.id;
    
    // Verificar se a locação existe
    db.get('SELECT id, status FROM locacoes WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar locação:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar locação' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locação não encontrada' });
        }
        
        // Verificar se a locação já foi finalizada ou cancelada
        if (row.status !== 'ativa') {
            return res.status(400).json({ success: false, message: `Não é possível cancelar uma locação ${row.status}` });
        }
        
        // Cancelar locação
        const sql = 'UPDATE locacoes SET status = "cancelada" WHERE id = ?';
        
        db.run(sql, [id], function(err) {
            if (err) {
                console.error('Erro ao cancelar locação:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao cancelar locação' });
            }
            
            res.json({ 
                success: true, 
                message: 'Locação cancelada com sucesso'
            });
        });
    });
});

module.exports = router;
