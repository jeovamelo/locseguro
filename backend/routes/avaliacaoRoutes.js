const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verificarToken, verificarCadastroCompleto, verificarPermissao } = require('./authRoutes');

// Obter locações pendentes de avaliação
router.get('/pendentes-avaliacao', verificarToken, verificarCadastroCompleto, async (req, res) => {
    const usuarioId = req.usuario.id;
    const tipoUsuario = req.usuario.tipo;
    
    try {
        let query;
        
        if (tipoUsuario === 'locadora') {
            // Para locadoras, buscar locações onde ela é a locadora e não avaliou o locatário
            query = `
                SELECT l.*, c.marca as carro_marca, c.modelo as carro_modelo, c.placa as carro_placa,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM locacoes l
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                LEFT JOIN avaliacoes_locatario al ON l.id = al.locacao_id
                WHERE l.locadora_id = (SELECT id FROM locadoras WHERE usuario_id = ?)
                AND al.id IS NULL
                ORDER BY l.data_inicio DESC
            `;
        } else {
            // Para locatários, buscar locações onde ele é o locatário e não avaliou a locadora
            query = `
                SELECT l.*, c.marca as carro_marca, c.modelo as carro_modelo, c.placa as carro_placa,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM locacoes l
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                LEFT JOIN avaliacoes_locadora al ON l.id = al.locacao_id
                WHERE l.locatario_id = (SELECT id FROM locatarios WHERE usuario_id = ?)
                AND al.id IS NULL
                ORDER BY l.data_inicio DESC
            `;
        }
        
        db.all(query, [usuarioId], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar locações pendentes:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao buscar locações pendentes' });
            }
            
            res.json({ success: true, data: rows });
        });
    } catch (error) {
        console.error('Erro ao buscar locações pendentes:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Registrar avaliação de locadora
router.post('/locadora', verificarToken, verificarCadastroCompleto, verificarPermissao('avaliar_locadora'), async (req, res) => {
    const usuarioId = req.usuario.id;
    const { locacao_id, nota, comentario, locacao_ativa } = req.body;
    
    if (!locacao_id || !nota || !comentario) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }
    
    try {
        // Verificar se o usuário é o locatário da locação
        db.get(
            `SELECT l.* FROM locacoes l
             JOIN locatarios loc ON l.locatario_id = loc.id
             WHERE l.id = ? AND loc.usuario_id = ?`,
            [locacao_id, usuarioId],
            (err, locacao) => {
                if (err) {
                    console.error('Erro ao verificar locação:', err.message);
                    return res.status(500).json({ success: false, message: 'Erro ao verificar locação' });
                }
                
                if (!locacao) {
                    return res.status(403).json({ success: false, message: 'Você não tem permissão para avaliar esta locação' });
                }
                
                // Verificar se já existe avaliação
                db.get('SELECT id FROM avaliacoes_locadora WHERE locacao_id = ?', [locacao_id], (err, avaliacao) => {
                    if (err) {
                        console.error('Erro ao verificar avaliação existente:', err.message);
                        return res.status(500).json({ success: false, message: 'Erro ao verificar avaliação existente' });
                    }
                    
                    if (avaliacao) {
                        return res.status(400).json({ success: false, message: 'Esta locação já foi avaliada' });
                    }
                    
                    // Inserir avaliação
                    db.run(
                        `INSERT INTO avaliacoes_locadora (locacao_id, nota, comentario, data_avaliacao, locacao_ativa)
                         VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
                        [locacao_id, nota, comentario, locacao_ativa ? 1 : 0],
                        function(err) {
                            if (err) {
                                console.error('Erro ao registrar avaliação:', err.message);
                                return res.status(500).json({ success: false, message: 'Erro ao registrar avaliação' });
                            }
                            
                            res.status(201).json({
                                success: true,
                                message: 'Avaliação registrada com sucesso',
                                data: { id: this.lastID }
                            });
                        }
                    );
                });
            }
        );
    } catch (error) {
        console.error('Erro ao registrar avaliação:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Registrar avaliação de locatário
router.post('/locatario', verificarToken, verificarCadastroCompleto, verificarPermissao('avaliar_locatario'), async (req, res) => {
    const usuarioId = req.usuario.id;
    const { locacao_id, nota, comentario, valor_prejuizo, locacao_ativa } = req.body;
    
    if (!locacao_id || !nota || !comentario) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }
    
    try {
        // Verificar se o usuário é a locadora da locação
        db.get(
            `SELECT l.* FROM locacoes l
             JOIN locadoras loc ON l.locadora_id = loc.id
             WHERE l.id = ? AND loc.usuario_id = ?`,
            [locacao_id, usuarioId],
            (err, locacao) => {
                if (err) {
                    console.error('Erro ao verificar locação:', err.message);
                    return res.status(500).json({ success: false, message: 'Erro ao verificar locação' });
                }
                
                if (!locacao) {
                    return res.status(403).json({ success: false, message: 'Você não tem permissão para avaliar esta locação' });
                }
                
                // Verificar se já existe avaliação
                db.get('SELECT id FROM avaliacoes_locatario WHERE locacao_id = ?', [locacao_id], (err, avaliacao) => {
                    if (err) {
                        console.error('Erro ao verificar avaliação existente:', err.message);
                        return res.status(500).json({ success: false, message: 'Erro ao verificar avaliação existente' });
                    }
                    
                    if (avaliacao) {
                        return res.status(400).json({ success: false, message: 'Esta locação já foi avaliada' });
                    }
                    
                    // Inserir avaliação
                    db.run(
                        `INSERT INTO avaliacoes_locatario (locacao_id, nota, comentario, valor_prejuizo, data_avaliacao, locacao_ativa)
                         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
                        [locacao_id, nota, comentario, valor_prejuizo || null, locacao_ativa ? 1 : 0],
                        function(err) {
                            if (err) {
                                console.error('Erro ao registrar avaliação:', err.message);
                                return res.status(500).json({ success: false, message: 'Erro ao registrar avaliação' });
                            }
                            
                            res.status(201).json({
                                success: true,
                                message: 'Avaliação registrada com sucesso',
                                data: { id: this.lastID }
                            });
                        }
                    );
                });
            }
        );
    } catch (error) {
        console.error('Erro ao registrar avaliação:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Obter avaliações realizadas pelo usuário
router.get('/realizadas', verificarToken, verificarCadastroCompleto, async (req, res) => {
    const usuarioId = req.usuario.id;
    const tipoUsuario = req.usuario.tipo;
    
    try {
        let query;
        
        if (tipoUsuario === 'locadora') {
            // Para locadoras, buscar avaliações que ela fez sobre locatários
            query = `
                SELECT al.*, l.data_inicio, l.data_fim, c.marca as carro_marca, c.modelo as carro_modelo, c.placa as carro_placa,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM avaliacoes_locatario al
                JOIN locacoes l ON al.locacao_id = l.id
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                WHERE lc.usuario_id = ?
                ORDER BY al.data_avaliacao DESC
            `;
        } else {
            // Para locatários, buscar avaliações que ele fez sobre locadoras
            query = `
                SELECT al.*, l.data_inicio, l.data_fim, c.marca as carro_marca, c.modelo as carro_modelo, c.placa as carro_placa,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM avaliacoes_locadora al
                JOIN locacoes l ON al.locacao_id = l.id
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                WHERE loc.usuario_id = ?
                ORDER BY al.data_avaliacao DESC
            `;
        }
        
        db.all(query, [usuarioId], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar avaliações realizadas:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao buscar avaliações realizadas' });
            }
            
            res.json({ success: true, data: rows });
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações realizadas:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Obter avaliações recebidas pelo usuário
router.get('/recebidas', verificarToken, verificarCadastroCompleto, async (req, res) => {
    const usuarioId = req.usuario.id;
    const tipoUsuario = req.usuario.tipo;
    
    try {
        let query;
        
        if (tipoUsuario === 'locadora') {
            // Para locadoras, buscar avaliações que locatários fizeram sobre ela
            query = `
                SELECT al.*, l.data_inicio, l.data_fim, c.marca as carro_marca, c.modelo as carro_modelo, c.placa as carro_placa,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM avaliacoes_locadora al
                JOIN locacoes l ON al.locacao_id = l.id
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                WHERE lc.usuario_id = ?
                ORDER BY al.data_avaliacao DESC
            `;
        } else {
            // Para locatários, buscar avaliações que locadoras fizeram sobre ele
            query = `
                SELECT al.*, l.data_inicio, l.data_fim, c.marca as carro_marca, c.modelo as carro_modelo, c.placa as carro_placa,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM avaliacoes_locatario al
                JOIN locacoes l ON al.locacao_id = l.id
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                WHERE loc.usuario_id = ?
                ORDER BY al.data_avaliacao DESC
            `;
        }
        
        db.all(query, [usuarioId], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar avaliações recebidas:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao buscar avaliações recebidas' });
            }
            
            res.json({ success: true, data: rows });
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações recebidas:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Consulta pública de avaliações
router.get('/consulta-publica/:tipo/:id', async (req, res) => {
    const { tipo, id } = req.params;
    
    if (tipo !== 'locadora' && tipo !== 'locatario') {
        return res.status(400).json({ success: false, message: 'Tipo inválido' });
    }
    
    try {
        let query;
        
        if (tipo === 'locadora') {
            // Consultar avaliações de uma locadora
            query = `
                SELECT al.*, l.data_inicio, l.data_fim, c.marca as carro_marca, c.modelo as carro_modelo,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM avaliacoes_locadora al
                JOIN locacoes l ON al.locacao_id = l.id
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                WHERE lc.id = ?
                ORDER BY al.data_avaliacao DESC
            `;
        } else {
            // Consultar avaliações de um locatário
            query = `
                SELECT al.*, l.data_inicio, l.data_fim, c.marca as carro_marca, c.modelo as carro_modelo,
                       loc.nome_completo as locatario_nome, lc.razao_social as locadora_nome
                FROM avaliacoes_locatario al
                JOIN locacoes l ON al.locacao_id = l.id
                JOIN carros c ON l.carro_id = c.id
                JOIN locatarios loc ON l.locatario_id = loc.id
                JOIN locadoras lc ON l.locadora_id = lc.id
                WHERE loc.id = ?
                ORDER BY al.data_avaliacao DESC
            `;
        }
        
        db.all(query, [id], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar avaliações públicas:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao buscar avaliações públicas' });
            }
            
            // Calcular média das avaliações
            let mediaNotas = 0;
            if (rows.length > 0) {
                const somaNotas = rows.reduce((soma, avaliacao) => soma + avaliacao.nota, 0);
                mediaNotas = somaNotas / rows.length;
            }
            
            // Calcular total de prejuízos (apenas para locatários)
            let totalPrejuizos = 0;
            if (tipo === 'locatario') {
                totalPrejuizos = rows.reduce((soma, avaliacao) => soma + (avaliacao.valor_prejuizo || 0), 0);
            }
            
            res.json({
                success: true,
                data: {
                    avaliacoes: rows,
                    estatisticas: {
                        total: rows.length,
                        media_notas: mediaNotas,
                        total_prejuizos: totalPrejuizos
                    }
                }
            });
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações públicas:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

module.exports = router;
