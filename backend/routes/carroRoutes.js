const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obter todos os carros
router.get('/', (req, res) => {
    const sql = `
        SELECT c.*, l.razao_social as locadora_nome
        FROM carros c
        JOIN locadoras l ON c.locadora_id = l.id
        WHERE c.disponivel = 1
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar carros:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar carros' });
        }
        
        // Buscar fotos para cada carro
        const carrosPromises = rows.map(carro => {
            return new Promise((resolve, reject) => {
                db.all('SELECT * FROM fotos_carros WHERE carro_id = ?', [carro.id], (err, fotos) => {
                    if (err) {
                        reject(err);
                    } else {
                        carro.fotos = fotos;
                        resolve(carro);
                    }
                });
            });
        });
        
        Promise.all(carrosPromises)
            .then(carrosComFotos => {
                res.json({ success: true, data: carrosComFotos });
            })
            .catch(err => {
                console.error('Erro ao buscar fotos dos carros:', err.message);
                res.status(500).json({ success: false, message: 'Erro ao buscar fotos dos carros' });
            });
    });
});

// Obter um carro específico
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT c.*, l.razao_social as locadora_nome
        FROM carros c
        JOIN locadoras l ON c.locadora_id = l.id
        WHERE c.id = ? AND c.disponivel = 1
    `;
    
    db.get(sql, [id], (err, carro) => {
        if (err) {
            console.error('Erro ao buscar carro:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar carro' });
        }
        
        if (!carro) {
            return res.status(404).json({ success: false, message: 'Carro não encontrado' });
        }
        
        // Buscar fotos do carro
        db.all('SELECT * FROM fotos_carros WHERE carro_id = ?', [id], (err, fotos) => {
            if (err) {
                console.error('Erro ao buscar fotos do carro:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao buscar fotos do carro' });
            }
            
            carro.fotos = fotos;
            res.json({ success: true, data: carro });
        });
    });
});

// Criar um novo carro
router.post('/', (req, res) => {
    const {
        locadora_id, marca, modelo, ano_fabricacao, ano_modelo,
        cor, placa, chassi, quilometragem, valor_diaria, observacoes,
        fotos
    } = req.body;
    
    // Verificar se a locadora existe
    db.get('SELECT id FROM locadoras WHERE id = ? AND ativo = 1', [locadora_id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar locadora:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar locadora' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Locadora não encontrada' });
        }
        
        // Verificar se a placa já existe
        db.get('SELECT id FROM carros WHERE placa = ?', [placa], (err, row) => {
            if (err) {
                console.error('Erro ao verificar placa:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao verificar placa' });
            }
            
            if (row) {
                return res.status(400).json({ success: false, message: 'Placa já cadastrada' });
            }
            
            // Inserir novo carro
            const sql = `
                INSERT INTO carros (
                    locadora_id, marca, modelo, ano_fabricacao, ano_modelo,
                    cor, placa, chassi, quilometragem, valor_diaria, observacoes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [
                locadora_id, marca, modelo, ano_fabricacao, ano_modelo,
                cor, placa, chassi, quilometragem, valor_diaria, observacoes
            ], function(err) {
                if (err) {
                    console.error('Erro ao cadastrar carro:', err.message);
                    return res.status(500).json({ success: false, message: 'Erro ao cadastrar carro' });
                }
                
                const carroId = this.lastID;
                
                // Se houver fotos, inserir na tabela de fotos
                if (fotos && fotos.length > 0) {
                    const insertFotoPromises = fotos.map(foto => {
                        return new Promise((resolve, reject) => {
                            db.run(
                                'INSERT INTO fotos_carros (carro_id, url_foto, descricao) VALUES (?, ?, ?)',
                                [carroId, foto.url, foto.descricao || ''],
                                function(err) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve(this.lastID);
                                    }
                                }
                            );
                        });
                    });
                    
                    Promise.all(insertFotoPromises)
                        .then(() => {
                            res.status(201).json({ 
                                success: true, 
                                message: 'Carro cadastrado com sucesso',
                                data: { id: carroId }
                            });
                        })
                        .catch(err => {
                            console.error('Erro ao cadastrar fotos do carro:', err.message);
                            res.status(500).json({ success: false, message: 'Erro ao cadastrar fotos do carro' });
                        });
                } else {
                    res.status(201).json({ 
                        success: true, 
                        message: 'Carro cadastrado com sucesso',
                        data: { id: carroId }
                    });
                }
            });
        });
    });
});

// Atualizar um carro
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const {
        marca, modelo, ano_fabricacao, ano_modelo,
        cor, chassi, quilometragem, valor_diaria, observacoes
    } = req.body;
    
    // Verificar se o carro existe
    db.get('SELECT id FROM carros WHERE id = ? AND disponivel = 1', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar carro:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar carro' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Carro não encontrado' });
        }
        
        // Atualizar carro
        const sql = `
            UPDATE carros SET
                marca = ?, modelo = ?, ano_fabricacao = ?, ano_modelo = ?,
                cor = ?, chassi = ?, quilometragem = ?, valor_diaria = ?, observacoes = ?
            WHERE id = ?
        `;
        
        db.run(sql, [
            marca, modelo, ano_fabricacao, ano_modelo,
            cor, chassi, quilometragem, valor_diaria, observacoes,
            id
        ], function(err) {
            if (err) {
                console.error('Erro ao atualizar carro:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar carro' });
            }
            
            res.json({ 
                success: true, 
                message: 'Carro atualizado com sucesso'
            });
        });
    });
});

// Adicionar foto a um carro
router.post('/:id/fotos', (req, res) => {
    const carroId = req.params.id;
    const { url_foto, descricao } = req.body;
    
    // Verificar se o carro existe
    db.get('SELECT id FROM carros WHERE id = ? AND disponivel = 1', [carroId], (err, row) => {
        if (err) {
            console.error('Erro ao verificar carro:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar carro' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Carro não encontrado' });
        }
        
        // Inserir foto
        const sql = 'INSERT INTO fotos_carros (carro_id, url_foto, descricao) VALUES (?, ?, ?)';
        
        db.run(sql, [carroId, url_foto, descricao || ''], function(err) {
            if (err) {
                console.error('Erro ao adicionar foto:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao adicionar foto' });
            }
            
            res.status(201).json({ 
                success: true, 
                message: 'Foto adicionada com sucesso',
                data: { id: this.lastID }
            });
        });
    });
});

// Remover foto de um carro
router.delete('/:carroId/fotos/:fotoId', (req, res) => {
    const carroId = req.params.carroId;
    const fotoId = req.params.fotoId;
    
    // Verificar se a foto existe e pertence ao carro
    db.get('SELECT id FROM fotos_carros WHERE id = ? AND carro_id = ?', [fotoId, carroId], (err, row) => {
        if (err) {
            console.error('Erro ao verificar foto:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar foto' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Foto não encontrada ou não pertence ao carro' });
        }
        
        // Remover foto
        const sql = 'DELETE FROM fotos_carros WHERE id = ?';
        
        db.run(sql, [fotoId], function(err) {
            if (err) {
                console.error('Erro ao remover foto:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao remover foto' });
            }
            
            res.json({ 
                success: true, 
                message: 'Foto removida com sucesso'
            });
        });
    });
});

// Desativar um carro (exclusão lógica)
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    // Verificar se o carro existe
    db.get('SELECT id FROM carros WHERE id = ? AND disponivel = 1', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar carro:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar carro' });
        }
        
        if (!row) {
            return res.status(404).json({ success: false, message: 'Carro não encontrado' });
        }
        
        // Desativar carro
        const sql = 'UPDATE carros SET disponivel = 0 WHERE id = ?';
        
        db.run(sql, [id], function(err) {
            if (err) {
                console.error('Erro ao desativar carro:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao desativar carro' });
            }
            
            res.json({ 
                success: true, 
                message: 'Carro desativado com sucesso'
            });
        });
    });
});

module.exports = router;
