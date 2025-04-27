const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Consultar avaliações de locadoras
router.get('/locadoras', (req, res) => {
    const { termo } = req.query;
    
    let sql = `
        SELECT 
            l.id, l.razao_social, l.nome_fantasia, l.cnpj,
            COUNT(DISTINCT al.id) as total_avaliacoes,
            AVG(al.nota) as nota_media
        FROM locadoras l
        LEFT JOIN locacoes loc ON l.id = loc.locadora_id
        LEFT JOIN avaliacoes_locatario al ON loc.id = al.locacao_id
        WHERE l.ativo = 1
    `;
    
    const params = [];
    
    if (termo) {
        sql += ` AND (l.razao_social LIKE ? OR l.nome_fantasia LIKE ? OR l.cnpj LIKE ?)`;
        params.push(`%${termo}%`, `%${termo}%`, `%${termo}%`);
    }
    
    sql += ` GROUP BY l.id ORDER BY nota_media DESC, total_avaliacoes DESC`;
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao consultar avaliações de locadoras:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao consultar avaliações de locadoras' });
        }
        
        // Para cada locadora, buscar os comentários mais recentes
        const locadorasPromises = rows.map(locadora => {
            return new Promise((resolve, reject) => {
                const comentariosSql = `
                    SELECT 
                        al.nota, al.comentario, al.data_avaliacao,
                        loc.data_fim as data_locacao
                    FROM avaliacoes_locatario al
                    JOIN locacoes loc ON al.locacao_id = loc.id
                    WHERE loc.locadora_id = ?
                    ORDER BY al.data_avaliacao DESC
                    LIMIT 5
                `;
                
                db.all(comentariosSql, [locadora.id], (err, comentarios) => {
                    if (err) {
                        reject(err);
                    } else {
                        locadora.comentarios = comentarios;
                        resolve(locadora);
                    }
                });
            });
        });
        
        Promise.all(locadorasPromises)
            .then(locadorasComComentarios => {
                res.json({ success: true, data: locadorasComComentarios });
            })
            .catch(err => {
                console.error('Erro ao buscar comentários:', err.message);
                res.status(500).json({ success: false, message: 'Erro ao buscar comentários' });
            });
    });
});

// Consultar avaliações de locatários
router.get('/locatarios', (req, res) => {
    const { termo } = req.query;
    
    let sql = `
        SELECT 
            lt.id, lt.nome_completo, lt.cpf,
            COUNT(DISTINCT al.id) as total_avaliacoes,
            AVG(al.nota) as nota_media,
            AVG(al.valor_prejuizo) as prejuizo_medio
        FROM locatarios lt
        LEFT JOIN locacoes loc ON lt.id = loc.locatario_id
        LEFT JOIN avaliacoes_locadora al ON loc.id = al.locacao_id
        WHERE lt.ativo = 1
    `;
    
    const params = [];
    
    if (termo) {
        sql += ` AND (lt.nome_completo LIKE ? OR lt.cpf LIKE ?)`;
        params.push(`%${termo}%`, `%${termo}%`);
    }
    
    sql += ` GROUP BY lt.id ORDER BY nota_media DESC, total_avaliacoes DESC`;
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao consultar avaliações de locatários:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao consultar avaliações de locatários' });
        }
        
        // Para cada locatário, buscar os comentários mais recentes
        const locatariosPromises = rows.map(locatario => {
            return new Promise((resolve, reject) => {
                const comentariosSql = `
                    SELECT 
                        al.nota, al.comentario, al.valor_prejuizo, al.data_avaliacao,
                        loc.data_fim as data_locacao
                    FROM avaliacoes_locadora al
                    JOIN locacoes loc ON al.locacao_id = loc.id
                    WHERE loc.locatario_id = ?
                    ORDER BY al.data_avaliacao DESC
                    LIMIT 5
                `;
                
                db.all(comentariosSql, [locatario.id], (err, comentarios) => {
                    if (err) {
                        reject(err);
                    } else {
                        locatario.comentarios = comentarios;
                        resolve(locatario);
                    }
                });
            });
        });
        
        Promise.all(locatariosPromises)
            .then(locatariosComComentarios => {
                res.json({ success: true, data: locatariosComComentarios });
            })
            .catch(err => {
                console.error('Erro ao buscar comentários:', err.message);
                res.status(500).json({ success: false, message: 'Erro ao buscar comentários' });
            });
    });
});

// Consulta geral (locadoras e locatários)
router.get('/', (req, res) => {
    const { termo, tipo } = req.query;
    
    if (!termo) {
        return res.status(400).json({ success: false, message: 'Termo de busca é obrigatório' });
    }
    
    // Definir quais consultas fazer com base no tipo
    const consultarLocadoras = tipo === 'todos' || tipo === 'locadora';
    const consultarLocatarios = tipo === 'todos' || tipo === 'locatario';
    
    const resultados = {
        locadoras: [],
        locatarios: []
    };
    
    const promises = [];
    
    // Consultar locadoras se necessário
    if (consultarLocadoras) {
        promises.push(
            new Promise((resolve, reject) => {
                const sql = `
                    SELECT 
                        l.id, l.razao_social, l.nome_fantasia, l.cnpj,
                        COUNT(DISTINCT al.id) as total_avaliacoes,
                        AVG(al.nota) as nota_media
                    FROM locadoras l
                    LEFT JOIN locacoes loc ON l.id = loc.locadora_id
                    LEFT JOIN avaliacoes_locatario al ON loc.id = al.locacao_id
                    WHERE l.ativo = 1
                    AND (l.razao_social LIKE ? OR l.nome_fantasia LIKE ? OR l.cnpj LIKE ?)
                    GROUP BY l.id
                    ORDER BY nota_media DESC, total_avaliacoes DESC
                `;
                
                db.all(sql, [`%${termo}%`, `%${termo}%`, `%${termo}%`], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Para cada locadora, buscar os comentários mais recentes
                        const locadorasPromises = rows.map(locadora => {
                            return new Promise((resolve, reject) => {
                                const comentariosSql = `
                                    SELECT 
                                        al.nota, al.comentario, al.data_avaliacao,
                                        loc.data_fim as data_locacao
                                    FROM avaliacoes_locatario al
                                    JOIN locacoes loc ON al.locacao_id = loc.id
                                    WHERE loc.locadora_id = ?
                                    ORDER BY al.data_avaliacao DESC
                                    LIMIT 3
                                `;
                                
                                db.all(comentariosSql, [locadora.id], (err, comentarios) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        locadora.comentarios = comentarios;
                                        locadora.tipo = 'locadora';
                                        resolve(locadora);
                                    }
                                });
                            });
                        });
                        
                        Promise.all(locadorasPromises)
                            .then(locadorasComComentarios => {
                                resultados.locadoras = locadorasComComentarios;
                                resolve();
                            })
                            .catch(err => {
                                reject(err);
                            });
                    }
                });
            })
        );
    }
    
    // Consultar locatários se necessário
    if (consultarLocatarios) {
        promises.push(
            new Promise((resolve, reject) => {
                const sql = `
                    SELECT 
                        lt.id, lt.nome_completo, lt.cpf,
                        COUNT(DISTINCT al.id) as total_avaliacoes,
                        AVG(al.nota) as nota_media,
                        AVG(al.valor_prejuizo) as prejuizo_medio
                    FROM locatarios lt
                    LEFT JOIN locacoes loc ON lt.id = loc.locatario_id
                    LEFT JOIN avaliacoes_locadora al ON loc.id = al.locacao_id
                    WHERE lt.ativo = 1
                    AND (lt.nome_completo LIKE ? OR lt.cpf LIKE ?)
                    GROUP BY lt.id
                    ORDER BY nota_media DESC, total_avaliacoes DESC
                `;
                
                db.all(sql, [`%${termo}%`, `%${termo}%`], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Para cada locatário, buscar os comentários mais recentes
                        const locatariosPromises = rows.map(locatario => {
                            return new Promise((resolve, reject) => {
                                const comentariosSql = `
                                    SELECT 
                                        al.nota, al.comentario, al.valor_prejuizo, al.data_avaliacao,
                                        loc.data_fim as data_locacao
                                    FROM avaliacoes_locadora al
                                    JOIN locacoes loc ON al.locacao_id = loc.id
                                    WHERE loc.locatario_id = ?
                                    ORDER BY al.data_avaliacao DESC
                                    LIMIT 3
                                `;
                                
                                db.all(comentariosSql, [locatario.id], (err, comentarios) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        locatario.comentarios = comentarios;
                                        locatario.tipo = 'locatario';
                                        resolve(locatario);
                                    }
                                });
                            });
                        });
                        
                        Promise.all(locatariosPromises)
                            .then(locatariosComComentarios => {
                                resultados.locatarios = locatariosComComentarios;
                                resolve();
                            })
                            .catch(err => {
                                reject(err);
                            });
                    }
                });
            })
        );
    }
    
    // Aguardar todas as consultas e retornar os resultados
    Promise.all(promises)
        .then(() => {
            // Combinar resultados em uma única lista
            const todosResultados = [
                ...resultados.locadoras,
                ...resultados.locatarios
            ];
            
            res.json({ 
                success: true, 
                data: {
                    todos: todosResultados,
                    locadoras: resultados.locadoras,
                    locatarios: resultados.locatarios
                }
            });
        })
        .catch(err => {
            console.error('Erro ao realizar consulta:', err.message);
            res.status(500).json({ success: false, message: 'Erro ao realizar consulta' });
        });
});

module.exports = router;
