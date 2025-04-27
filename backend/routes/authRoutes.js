const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'locseguro_jwt_secret';
const JWT_EXPIRES_IN = '24h';

// Registrar novo usuário (cadastro inicial)
router.post('/registrar', async (req, res) => {
    const { email, senha, tipo } = req.body;
    
    if (!email || !senha || !tipo) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email, senha e tipo de usuário são obrigatórios' 
        });
    }
    
    if (tipo !== 'locadora' && tipo !== 'locatario') {
        return res.status(400).json({ 
            success: false, 
            message: 'Tipo de usuário inválido. Deve ser "locadora" ou "locatario"' 
        });
    }
    
    try {
        // Verificar se o email já está em uso
        db.get('SELECT id FROM usuarios WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Erro ao verificar email:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao verificar email' });
            }
            
            if (row) {
                return res.status(400).json({ success: false, message: 'Email já cadastrado' });
            }
            
            // Hash da senha
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);
            
            // Inserir novo usuário
            db.run(
                'INSERT INTO usuarios (email, senha, tipo, cadastro_completo) VALUES (?, ?, ?, 0)',
                [email, senhaHash, tipo],
                function(err) {
                    if (err) {
                        console.error('Erro ao cadastrar usuário:', err.message);
                        return res.status(500).json({ success: false, message: 'Erro ao cadastrar usuário' });
                    }
                    
                    const usuarioId = this.lastID;
                    
                    // Gerar token JWT
                    const token = jwt.sign(
                        { id: usuarioId, email, tipo, cadastro_completo: false },
                        JWT_SECRET,
                        { expiresIn: JWT_EXPIRES_IN }
                    );
                    
                    // Registrar sessão
                    const dataExpiracao = new Date();
                    dataExpiracao.setHours(dataExpiracao.getHours() + 24); // 24 horas
                    
                    db.run(
                        'INSERT INTO sessoes (usuario_id, token, data_expiracao, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
                        [
                            usuarioId, 
                            token, 
                            dataExpiracao.toISOString(),
                            req.ip || 'unknown',
                            req.headers['user-agent'] || 'unknown'
                        ],
                        (err) => {
                            if (err) {
                                console.error('Erro ao registrar sessão:', err.message);
                            }
                        }
                    );
                    
                    res.status(201).json({
                        success: true,
                        message: 'Cadastro iniciado com sucesso. Complete seu perfil para acessar o sistema.',
                        data: {
                            usuario_id: usuarioId,
                            email,
                            tipo,
                            cadastro_completo: false,
                            token
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Login de usuário
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email e senha são obrigatórios' 
        });
    }
    
    try {
        // Buscar usuário pelo email
        db.get('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email], async (err, usuario) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
            }
            
            if (!usuario) {
                return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
            }
            
            // Verificar senha
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
            
            if (!senhaCorreta) {
                return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
            }
            
            // Atualizar último acesso
            db.run('UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);
            
            // Gerar token JWT
            const token = jwt.sign(
                { 
                    id: usuario.id, 
                    email: usuario.email, 
                    tipo: usuario.tipo,
                    cadastro_completo: !!usuario.cadastro_completo
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            
            // Registrar sessão
            const dataExpiracao = new Date();
            dataExpiracao.setHours(dataExpiracao.getHours() + 24); // 24 horas
            
            db.run(
                'INSERT INTO sessoes (usuario_id, token, data_expiracao, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
                [
                    usuario.id, 
                    token, 
                    dataExpiracao.toISOString(),
                    req.ip || 'unknown',
                    req.headers['user-agent'] || 'unknown'
                ],
                (err) => {
                    if (err) {
                        console.error('Erro ao registrar sessão:', err.message);
                    }
                }
            );
            
            // Buscar informações adicionais do usuário
            if (usuario.tipo === 'locadora') {
                db.get('SELECT * FROM locadoras WHERE usuario_id = ?', [usuario.id], (err, locadora) => {
                    if (err) {
                        console.error('Erro ao buscar dados da locadora:', err.message);
                    }
                    
                    res.json({
                        success: true,
                        message: 'Login realizado com sucesso',
                        data: {
                            usuario_id: usuario.id,
                            email: usuario.email,
                            tipo: usuario.tipo,
                            cadastro_completo: !!usuario.cadastro_completo,
                            token,
                            perfil: locadora || null
                        }
                    });
                });
            } else {
                db.get('SELECT * FROM locatarios WHERE usuario_id = ?', [usuario.id], (err, locatario) => {
                    if (err) {
                        console.error('Erro ao buscar dados do locatário:', err.message);
                    }
                    
                    res.json({
                        success: true,
                        message: 'Login realizado com sucesso',
                        data: {
                            usuario_id: usuario.id,
                            email: usuario.email,
                            tipo: usuario.tipo,
                            cadastro_completo: !!usuario.cadastro_completo,
                            token,
                            perfil: locatario || null
                        }
                    });
                });
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Verificar status do cadastro
router.get('/status', verificarToken, (req, res) => {
    const usuarioId = req.usuario.id;
    
    db.get('SELECT * FROM usuarios WHERE id = ?', [usuarioId], (err, usuario) => {
        if (err) {
            console.error('Erro ao verificar status do cadastro:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar status do cadastro' });
        }
        
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        
        res.json({
            success: true,
            data: {
                usuario_id: usuario.id,
                email: usuario.email,
                tipo: usuario.tipo,
                cadastro_completo: !!usuario.cadastro_completo
            }
        });
    });
});

// Completar cadastro de locadora
router.post('/completar-cadastro/locadora', verificarToken, (req, res) => {
    const usuarioId = req.usuario.id;
    const tipo = req.usuario.tipo;
    
    if (tipo !== 'locadora') {
        return res.status(403).json({ success: false, message: 'Acesso negado. Apenas locadoras podem acessar este recurso.' });
    }
    
    const {
        razao_social, nome_fantasia, cnpj, inscricao_estadual,
        cep, rua, numero, complemento, bairro, cidade, estado,
        telefone_comercial, email_comercial,
        responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
        responsavel_telefone, responsavel_email
    } = req.body;
    
    // Validar campos obrigatórios
    if (!razao_social || !cnpj || !cep || !rua || !numero || !bairro || !cidade || !estado || !telefone_comercial) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios não preenchidos' });
    }
    
    // Verificar se o CNPJ já existe
    db.get('SELECT id FROM locadoras WHERE cnpj = ? AND usuario_id != ?', [cnpj, usuarioId], (err, row) => {
        if (err) {
            console.error('Erro ao verificar CNPJ:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar CNPJ' });
        }
        
        if (row) {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        
        // Verificar se já existe cadastro para este usuário
        db.get('SELECT id FROM locadoras WHERE usuario_id = ?', [usuarioId], (err, locadora) => {
            if (err) {
                console.error('Erro ao verificar cadastro existente:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao verificar cadastro existente' });
            }
            
            if (locadora) {
                // Atualizar cadastro existente
                const sql = `
                    UPDATE locadoras SET
                        razao_social = ?, nome_fantasia = ?, cnpj = ?, inscricao_estadual = ?,
                        cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?,
                        telefone_comercial = ?, email_comercial = ?,
                        responsavel_nome = ?, responsavel_cpf = ?, responsavel_data_nascimento = ?,
                        responsavel_telefone = ?, responsavel_email = ?
                    WHERE usuario_id = ?
                `;
                
                db.run(sql, [
                    razao_social, nome_fantasia, cnpj, inscricao_estadual,
                    cep, rua, numero, complemento, bairro, cidade, estado,
                    telefone_comercial, email_comercial,
                    responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
                    responsavel_telefone, responsavel_email,
                    usuarioId
                ], function(err) {
                    if (err) {
                        console.error('Erro ao atualizar cadastro de locadora:', err.message);
                        return res.status(500).json({ success: false, message: 'Erro ao atualizar cadastro de locadora' });
                    }
                    
                    // Marcar cadastro como completo
                    db.run('UPDATE usuarios SET cadastro_completo = 1 WHERE id = ?', [usuarioId], function(err) {
                        if (err) {
                            console.error('Erro ao atualizar status do cadastro:', err.message);
                            return res.status(500).json({ success: false, message: 'Erro ao atualizar status do cadastro' });
                        }
                        
                        res.json({ 
                            success: true, 
                            message: 'Cadastro atualizado com sucesso',
                            data: { id: locadora.id }
                        });
                    });
                });
            } else {
                // Inserir novo cadastro
                const sql = `
                    INSERT INTO locadoras (
                        usuario_id, razao_social, nome_fantasia, cnpj, inscricao_estadual,
                        cep, rua, numero, complemento, bairro, cidade, estado,
                        telefone_comercial, email_comercial,
                        responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
                        responsavel_telefone, responsavel_email
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                db.run(sql, [
                    usuarioId, razao_social, nome_fantasia, cnpj, inscricao_estadual,
                    cep, rua, numero, complemento, bairro, cidade, estado,
                    telefone_comercial, email_comercial,
                    responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
                    responsavel_telefone, responsavel_email
                ], function(err) {
                    if (err) {
                        console.error('Erro ao cadastrar locadora:', err.message);
                        return res.status(500).json({ success: false, message: 'Erro ao cadastrar locadora' });
                    }
                    
                    // Marcar cadastro como completo
                    db.run('UPDATE usuarios SET cadastro_completo = 1 WHERE id = ?', [usuarioId], function(err) {
                        if (err) {
                            console.error('Erro ao atualizar status do cadastro:', err.message);
                            return res.status(500).json({ success: false, message: 'Erro ao atualizar status do cadastro' });
                        }
                        
                        res.status(201).json({ 
                            success: true, 
                            message: 'Cadastro completado com sucesso',
                            data: { id: this.lastID }
                        });
                    });
                });
            }
        });
    });
});

// Completar cadastro de locatário
router.post('/completar-cadastro/locatario', verificarToken, (req, res) => {
    const usuarioId = req.usuario.id;
    const tipo = req.usuario.tipo;
    
    if (tipo !== 'locatario') {
        return res.status(403).json({ success: false, message: 'Acesso negado. Apenas locatários podem acessar este recurso.' });
    }
    
    const {
        nome_completo, cpf, data_nascimento, telefone, email,
        cep, rua, numero, complemento, bairro, cidade, estado,
        cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
        cnh_orgao_emissor, cnh_uf_emissao
    } = req.body;
    
    // Validar campos obrigatórios
    if (!nome_completo || !cpf || !data_nascimento || !telefone || !cep || !rua || !numero || !bairro || !cidade || !estado || !cnh_numero) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios não preenchidos' });
    }
    
    // Verificar se o CPF já existe
    db.get('SELECT id FROM locatarios WHERE cpf = ? AND usuario_id != ?', [cpf, usuarioId], (err, row) => {
        if (err) {
            console.error('Erro ao verificar CPF:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar CPF' });
        }
        
        if (row) {
            return res.status(400).json({ success: false, message: 'CPF já cadastrado' });
        }
        
        // Verificar se a CNH já existe
        db.get('SELECT id FROM locatarios WHERE cnh_numero = ? AND usuario_id != ?', [cnh_numero, usuarioId], (err, row) => {
            if (err) {
                console.error('Erro ao verificar CNH:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao verificar CNH' });
            }
            
            if (row) {
                return res.status(400).json({ success: false, message: 'CNH já cadastrada' });
            }
            
            // Verificar se já existe cadastro para este usuário
            db.get('SELECT id FROM locatarios WHERE usuario_id = ?', [usuarioId], (err, locatario) => {
                if (err) {
                    console.error('Erro ao verificar cadastro existente:', err.message);
                    return res.status(500).json({ success: false, message: 'Erro ao verificar cadastro existente' });
                }
                
                if (locatario) {
                    // Atualizar cadastro existente
                    const sql = `
                        UPDATE locatarios SET
                            nome_completo = ?, cpf = ?, data_nascimento = ?, telefone = ?, email = ?,
                            cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?,
                            cnh_numero = ?, cnh_categoria = ?, cnh_data_emissao = ?, cnh_validade = ?,
                            cnh_orgao_emissor = ?, cnh_uf_emissao = ?
                        WHERE usuario_id = ?
                    `;
                    
                    db.run(sql, [
                        nome_completo, cpf, data_nascimento, telefone, email,
                        cep, rua, numero, complemento, bairro, cidade, estado,
                        cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
                        cnh_orgao_emissor, cnh_uf_emissao,
                        usuarioId
                    ], function(err) {
                        if (err) {
                            console.error('Erro ao atualizar cadastro de locatário:', err.message);
                            return res.status(500).json({ success: false, message: 'Erro ao atualizar cadastro de locatário' });
                        }
                        
                        // Marcar cadastro como completo
                        db.run('UPDATE usuarios SET cadastro_completo = 1 WHERE id = ?', [usuarioId], function(err) {
                            if (err) {
                                console.error('Erro ao atualizar status do cadastro:', err.message);
                                return res.status(500).json({ success: false, message: 'Erro ao atualizar status do cadastro' });
                            }
                            
                            res.json({ 
                                success: true, 
                                message: 'Cadastro atualizado com sucesso',
                                data: { id: locatario.id }
                            });
                        });
                    });
                } else {
                    // Inserir novo cadastro
                    const sql = `
                        INSERT INTO locatarios (
                            usuario_id, nome_completo, cpf, data_nascimento, telefone, email,
                            cep, rua, numero, complemento, bairro, cidade, estado,
                            cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
                            cnh_orgao_emissor, cnh_uf_emissao
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.run(sql, [
                        usuarioId, nome_completo, cpf, data_nascimento, telefone, email,
                        cep, rua, numero, complemento, bairro, cidade, estado,
                        cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
                        cnh_orgao_emissor, cnh_uf_emissao
                    ], function(err) {
                        if (err) {
                            console.error('Erro ao cadastrar locatário:', err.message);
                            return res.status(500).json({ success: false, message: 'Erro ao cadastrar locatário' });
                        }
                        
                        // Marcar cadastro como completo
                        db.run('UPDATE usuarios SET cadastro_completo = 1 WHERE id = ?', [usuarioId], function(err) {
                            if (err) {
                                console.error('Erro ao atualizar status do cadastro:', err.message);
                                return res.status(500).json({ success: false, message: 'Erro ao atualizar status do cadastro' });
                            }
                            
                            res.status(201).json({ 
                                success: true, 
                                message: 'Cadastro completado com sucesso',
                                data: { id: this.lastID }
                            });
                        });
                    });
                }
            });
        });
    });
});

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        
        // Verificar se o token está na tabela de sessões
        db.get('SELECT * FROM sessoes WHERE token = ? AND data_expiracao > CURRENT_TIMESTAMP', [token], (err, sessao) => {
            if (err) {
                console.error('Erro ao verificar sessão:', err.message);
                return res.status(500).json({ success: false, message: 'Erro ao verificar sessão' });
            }
            
            if (!sessao) {
                return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada' });
            }
            
            next();
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
}

// Middleware para verificar se o cadastro está completo
function verificarCadastroCompleto(req, res, next) {
    const usuarioId = req.usuario.id;
    
    db.get('SELECT cadastro_completo FROM usuarios WHERE id = ?', [usuarioId], (err, usuario) => {
        if (err) {
            console.error('Erro ao verificar status do cadastro:', err.message);
            return res.status(500).json({ success: false, message: 'Erro ao verificar status do cadastro' });
        }
        
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        
        if (!usuario.cadastro_completo) {
            return res.status(403).json({ 
                success: false, 
                message: 'Cadastro incompleto. Complete seu perfil para acessar esta funcionalidade.',
                redirect: '/completar-cadastro'
            });
        }
        
        next();
    });
}

// Middleware para verificar permissões
function verificarPermissao(permissao) {
    return (req, res, next) => {
        const tipo = req.usuario.tipo;
        
        db.get(
            `SELECT * FROM tipo_usuario_permissoes tup
             JOIN permissoes p ON tup.permissao_id = p.id
             WHERE tup.tipo_usuario = ? AND p.nome = ?`,
            [tipo, permissao],
            (err, row) => {
                if (err) {
                    console.error('Erro ao verificar permissão:', err.message);
                    return res.status(500).json({ success: false, message: 'Erro ao verificar permissão' });
                }
                
                if (!row) {
                    return res.status(403).json({ success: false, message: 'Acesso negado. Você não tem permissão para acessar este recurso.' });
                }
                
                next();
            }
        );
    };
}

// Exportar middlewares para uso em outras rotas
module.exports = {
    router,
    verificarToken,
    verificarCadastroCompleto,
    verificarPermissao
};
