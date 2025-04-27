require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');

// Configurações
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'locseguro_secret_key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
        req.user = user;
        next();
    });
};

// Middleware de verificação de permissões
const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const userType = req.user.tipo;
            
            // Verificar se o tipo de usuário tem a permissão necessária
            const permissionExists = await db.queryOne(
                'SELECT * FROM tipo_usuario_permissoes tup JOIN permissoes p ON tup.permissao_id = p.id WHERE tup.tipo_usuario = ? AND p.nome = ?',
                [userType, permission]
            );
            
            if (!permissionExists) {
                return res.status(403).json({ error: 'Você não tem permissão para acessar este recurso' });
            }
            
            next();
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };
};

// Inicializar o banco de dados
db.initDatabase()
    .then(() => {
        console.log('Banco de dados inicializado com sucesso');
    })
    .catch(err => {
        console.error('Erro ao inicializar banco de dados:', err);
        process.exit(1);
    });

// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, senha, tipo } = req.body;
        
        if (!email || !senha || !tipo) {
            return res.status(400).json({ error: 'Email, senha e tipo são obrigatórios' });
        }
        
        if (tipo !== 'locadora' && tipo !== 'locatario') {
            return res.status(400).json({ error: 'Tipo deve ser locadora ou locatario' });
        }
        
        // Verificar se o email já existe
        const existingUser = await db.queryOne('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);
        
        // Inserir usuário
        const userId = await db.insert('usuarios', {
            email,
            senha: hashedPassword,
            tipo,
            cadastro_completo: 0,
            data_cadastro: new Date(),
            ativo: 1
        });
        
        // Gerar token
        const token = jwt.sign(
            { id: userId, email, tipo, perfil_completo: false },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );
        
        res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            token,
            user: {
                id: userId,
                email,
                tipo,
                perfil_completo: false
            }
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }
        
        // Buscar usuário
        const user = await db.queryOne('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }
        
        // Verificar senha
        const validPassword = await bcrypt.compare(senha, user.senha);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }
        
        // Atualizar último acesso
        await db.update('usuarios', 
            { ultimo_acesso: new Date() },
            { id: user.id }
        );
        
        // Gerar token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                tipo: user.tipo,
                perfil_completo: user.cadastro_completo === 1
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );
        
        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                email: user.email,
                tipo: user.tipo,
                perfil_completo: user.cadastro_completo === 1
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas para Locadoras
app.post('/api/locadoras', authenticateToken, async (req, res) => {
    try {
        const { 
            razao_social, nome_fantasia, cnpj, inscricao_estadual,
            cep, rua, numero, complemento, bairro, cidade, estado,
            telefone_comercial, email_comercial,
            responsavel_nome, responsavel_cpf, responsavel_data_nascimento,
            responsavel_telefone, responsavel_email
        } = req.body;
        
        // Verificar se o usuário é do tipo locadora
        if (req.user.tipo !== 'locadora') {
            return res.status(403).json({ error: 'Apenas locadoras podem acessar este recurso' });
        }
        
        // Verificar campos obrigatórios
        if (!razao_social || !nome_fantasia || !cnpj || !cep || !rua || !numero ||
            !bairro || !cidade || !estado || !telefone_comercial || !email_comercial ||
            !responsavel_nome || !responsavel_cpf || !responsavel_data_nascimento ||
            !responsavel_telefone || !responsavel_email) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }
        
        // Verificar se o CNPJ já está cadastrado
        const existingLocadora = await db.queryOne('SELECT * FROM locadoras WHERE cnpj = ?', [cnpj]);
        
        if (existingLocadora) {
            return res.status(400).json({ error: 'CNPJ já cadastrado' });
        }
        
        // Inserir locadora
        const locadoraId = await db.insert('locadoras', {
            usuario_id: req.user.id,
            razao_social,
            nome_fantasia,
            cnpj,
            inscricao_estadual: inscricao_estadual || null,
            cep,
            rua,
            numero,
            complemento: complemento || null,
            bairro,
            cidade,
            estado,
            telefone_comercial,
            email_comercial,
            responsavel_nome,
            responsavel_cpf,
            responsavel_data_nascimento,
            responsavel_telefone,
            responsavel_email,
            data_cadastro: new Date(),
            ativo: 1
        });
        
        // Atualizar status de perfil completo
        await db.update('usuarios',
            { cadastro_completo: 1 },
            { id: req.user.id }
        );
        
        res.status(201).json({
            message: 'Locadora cadastrada com sucesso',
            locadora_id: locadoraId
        });
    } catch (error) {
        console.error('Erro ao cadastrar locadora:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/locadoras', async (req, res) => {
    try {
        const locadoras = await db.query('SELECT * FROM locadoras WHERE ativo = 1');
        res.json(locadoras);
    } catch (error) {
        console.error('Erro ao buscar locadoras:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/locadoras/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const locadora = await db.queryOne('SELECT * FROM locadoras WHERE id = ? AND ativo = 1', [id]);
        
        if (!locadora) {
            return res.status(404).json({ error: 'Locadora não encontrada' });
        }
        
        res.json(locadora);
    } catch (error) {
        console.error('Erro ao buscar locadora:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas para Locatários
app.post('/api/locatarios', authenticateToken, async (req, res) => {
    try {
        const { 
            nome_completo, cpf, data_nascimento, telefone, email,
            cep, rua, numero, complemento, bairro, cidade, estado,
            cnh_numero, cnh_categoria, cnh_data_emissao, cnh_validade,
            cnh_orgao_emissor, cnh_uf_emissao
        } = req.body;
        
        // Verificar se o usuário é do tipo locatário
        if (req.user.tipo !== 'locatario') {
            return res.status(403).json({ error: 'Apenas locatários podem acessar este recurso' });
        }
        
        // Verificar campos obrigatórios
        if (!nome_completo || !cpf || !data_nascimento || !telefone || !email ||
            !cep || !rua || !numero || !bairro || !cidade || !estado ||
            !cnh_numero || !cnh_categoria || !cnh_data_emissao || !cnh_validade ||
            !cnh_orgao_emissor || !cnh_uf_emissao) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }
        
        // Verificar se o CPF já está cadastrado
        const existingLocatario = await db.queryOne('SELECT * FROM locatarios WHERE cpf = ?', [cpf]);
        
        if (existingLocatario) {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }
        
        // Verificar se o número da CNH já está cadastrado
        const existingCNH = await db.queryOne('SELECT * FROM locatarios WHERE cnh_numero = ?', [cnh_numero]);
        
        if (existingCNH) {
            return res.status(400).json({ error: 'Número de CNH já cadastrado' });
        }
        
        // Inserir locatário
        const locatarioId = await db.insert('locatarios', {
            usuario_id: req.user.id,
            nome_completo,
            cpf,
            data_nascimento,
            telefone,
            email,
            cep,
            rua,
            numero,
            complemento: complemento || null,
            bairro,
            cidade,
            estado,
            cnh_numero,
            cnh_categoria,
            cnh_data_emissao,
            cnh_validade,
            cnh_orgao_emissor,
            cnh_uf_emissao,
            data_cadastro: new Date(),
            ativo: 1
        });
        
        // Atualizar status de perfil completo
        await db.update('usuarios',
            { cadastro_completo: 1 },
            { id: req.user.id }
        );
        
        res.status(201).json({
            message: 'Locatário cadastrado com sucesso',
            locatario_id: locatarioId
        });
    } catch (error) {
        console.error('Erro ao cadastrar locatário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/locatarios', async (req, res) => {
    try {
        const locatarios = await db.query('SELECT * FROM locatarios WHERE ativo = 1');
        res.json(locatarios);
    } catch (error) {
        console.error('Erro ao buscar locatários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/locatarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const locatario = await db.queryOne('SELECT * FROM locatarios WHERE id = ? AND ativo = 1', [id]);
        
        if (!locatario) {
            return res.status(404).json({ error: 'Locatário não encontrado' });
        }
        
        res.json(locatario);
    } catch (error) {
        console.error('Erro ao buscar locatário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas para Carros
app.post('/api/carros', authenticateToken, checkPermission('cadastrar_carro'), async (req, res) => {
    try {
        const { 
            marca, modelo, ano_fabricacao, ano_modelo, cor, placa,
            chassi, quilometragem, valor_diaria, observacoes
        } = req.body;
        
        // Verificar campos obrigatórios
        if (!marca || !modelo || !ano_fabricacao || !ano_modelo || !cor || !placa ||
            quilometragem === undefined || valor_diaria === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }
        
        // Buscar ID da locadora
        const locadora = await db.queryOne('SELECT id FROM locadoras WHERE usuario_id = ?', [req.user.id]);
        
        if (!locadora) {
            return res.status(404).json({ error: 'Locadora não encontrada. Complete seu cadastro primeiro.' });
        }
        
        const locadora_id = locadora.id;
        
        // Verificar se a placa já está cadastrada
        const existingCarro = await db.queryOne('SELECT * FROM carros WHERE placa = ?', [placa]);
        
        if (existingCarro) {
            return res.status(400).json({ error: 'Placa já cadastrada' });
        }
        
        // Inserir carro
        const carroId = await db.insert('carros', {
            locadora_id,
            marca,
            modelo,
            ano_fabricacao,
            ano_modelo,
            cor,
            placa,
            chassi: chassi || null,
            quilometragem,
            valor_diaria,
            observacoes: observacoes || null,
            disponivel: 1,
            data_cadastro: new Date()
        });
        
        res.status(201).json({
            message: 'Carro cadastrado com sucesso',
            carro_id: carroId
        });
    } catch (error) {
        console.error('Erro ao cadastrar carro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/carros', async (req, res) => {
    try {
        const { disponivel, locadora_id } = req.query;
        
        let query = 'SELECT * FROM carros';
        const params = [];
        
        if (disponivel !== undefined || locadora_id) {
            query += ' WHERE';
            
            if (disponivel !== undefined) {
                query += ' disponivel = ?';
                params.push(disponivel === 'true' ? 1 : 0);
            }
            
            if (locadora_id) {
                if (disponivel !== undefined) {
                    query += ' AND';
                }
                query += ' locadora_id = ?';
                params.push(locadora_id);
            }
        }
        
        const carros = await db.query(query, params);
        res.json(carros);
    } catch (error) {
        console.error('Erro ao buscar carros:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/carros/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const carro = await db.queryOne('SELECT * FROM carros WHERE id = ?', [id]);
        
        if (!carro) {
            return res.status(404).json({ error: 'Carro não encontrado' });
        }
        
        res.json(carro);
    } catch (error) {
        console.error('Erro ao buscar carro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas para Locações
app.post('/api/locacoes', authenticateToken, async (req, res) => {
    try {
        const { 
            carro_id, data_inicio, data_fim, observacoes 
        } = req.body;
        
        // Verificar campos obrigatórios
        if (!carro_id || !data_inicio || !data_fim) {
            return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }
        
        // Verificar se o carro existe e está disponível
        const carro = await db.queryOne('SELECT * FROM carros WHERE id = ? AND disponivel = 1', [carro_id]);
        
        if (!carro) {
            return res.status(404).json({ error: 'Carro não encontrado ou não disponível' });
        }
        
        // Obter IDs necessários
        let locadora_id, locatario_id;
        
        if (req.user.tipo === 'locadora') {
            // Se for locadora, precisa informar o locatário
            if (!req.body.locatario_id) {
                return res.status(400).json({ error: 'ID do locatário é obrigatório' });
            }
            
            locatario_id = req.body.locatario_id;
            
            // Verificar se o locatário existe
            const locatario = await db.queryOne('SELECT * FROM locatarios WHERE id = ? AND ativo = 1', [locatario_id]);
            
            if (!locatario) {
                return res.status(404).json({ error: 'Locatário não encontrado' });
            }
            
            // Obter ID da locadora
            const locadora = await db.queryOne('SELECT id FROM locadoras WHERE usuario_id = ? AND ativo = 1', [req.user.id]);
            
            if (!locadora) {
                return res.status(404).json({ error: 'Locadora não encontrada. Complete seu cadastro primeiro.' });
            }
            
            locadora_id = locadora.id;
            
            // Verificar se a locadora é dona do carro
            if (carro.locadora_id !== locadora_id) {
                return res.status(403).json({ error: 'Você não tem permissão para alugar este carro' });
            }
        } else if (req.user.tipo === 'locatario') {
            // Se for locatário, o carro já define a locadora
            locadora_id = carro.locadora_id;
            
            // Obter ID do locatário
            const locatario = await db.queryOne('SELECT id FROM locatarios WHERE usuario_id = ? AND ativo = 1', [req.user.id]);
            
            if (!locatario) {
                return res.status(404).json({ error: 'Locatário não encontrado. Complete seu cadastro primeiro.' });
            }
            
            locatario_id = locatario.id;
        } else {
            return res.status(403).json({ error: 'Tipo de usuário não permitido' });
        }
        
        // Calcular valor total
        const dataInicio = new Date(data_inicio);
        const dataFim = new Date(data_fim);
        const diffTime = Math.abs(dataFim - dataInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const valorTotal = diffDays * carro.valor_diaria;
        
        // Definir status da solicitação
        const statusSolicitacao = req.user.tipo === 'locadora' ? 'aprovada' : 'pendente';
        
        // Inserir locação
        const locacaoId = await db.insert('locacoes', {
            carro_id,
            locadora_id,
            locatario_id,
            data_inicio,
            data_fim,
            valor_total: valorTotal,
            observacoes: observacoes || null,
            retroativa: 0,
            status: 'ativa',
            status_solicitacao: statusSolicitacao,
            data_cadastro: new Date()
        });
        
        // Se a locação for aprovada, atualizar disponibilidade do carro
        if (statusSolicitacao === 'aprovada') {
            await db.update('carros',
                { disponivel: 0 },
                { id: carro_id }
            );
        }
        
        res.status(201).json({
            message: req.user.tipo === 'locadora' 
                ? 'Locação cadastrada com sucesso' 
                : 'Solicitação de locação enviada com sucesso',
            locacao_id: locacaoId,
            status_solicitacao: statusSolicitacao
        });
    } catch (error) {
        console.error('Erro ao cadastrar locação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/locacoes', authenticateToken, async (req, res) => {
    try {
        const { status, locadora_id, locatario_id } = req.query;
        
        let query = 'SELECT * FROM locacoes';
        const params = [];
        let whereAdded = false;
        
        // Filtrar por status
        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
            whereAdded = true;
        }
        
        // Filtrar por locadora
        if (locadora_id) {
            query += whereAdded ? ' AND' : ' WHERE';
            query += ' locadora_id = ?';
            params.push(locadora_id);
            whereAdded = true;
        }
        
        // Filtrar por locatário
        if (locatario_id) {
            query += whereAdded ? ' AND' : ' WHERE';
            query += ' locatario_id = ?';
            params.push(locatario_id);
        }
        
        // Restrição por tipo de usuário
        if (req.user.tipo === 'locadora') {
            // Locadora só vê suas próprias locações
            const locadora = await db.queryOne('SELECT id FROM locadoras WHERE usuario_id = ?', [req.user.id]);
            
            if (locadora) {
                query += whereAdded ? ' AND' : ' WHERE';
                query += ' locadora_id = ?';
                params.push(locadora.id);
            }
        } else if (req.user.tipo === 'locatario') {
            // Locatário só vê suas próprias locações
            const locatario = await db.queryOne('SELECT id FROM locatarios WHERE usuario_id = ?', [req.user.id]);
            
            if (locatario) {
                query += whereAdded ? ' AND' : ' WHERE';
                query += ' locatario_id = ?';
                params.push(locatario.id);
            }
        }
        
        const locacoes = await db.query(query, params);
        res.json(locacoes);
    } catch (error) {
        console.error('Erro ao buscar locações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/locacoes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const locacao = await db.queryOne('SELECT * FROM locacoes WHERE id = ?', [id]);
        
        if (!locacao) {
            return res.status(404).json({ error: 'Locação não encontrada' });
        }
        
        // Verificar permissão
        if (req.user.tipo === 'locadora') {
            const locadora = await db.queryOne('SELECT id FROM locadoras WHERE usuario_id = ?', [req.user.id]);
            
            if (!locadora || locadora.id !== locacao.locadora_id) {
                return res.status(403).json({ error: 'Você não tem permissão para acessar esta locação' });
            }
        } else if (req.user.tipo === 'locatario') {
            const locatario = await db.queryOne('SELECT id FROM locatarios WHERE usuario_id = ?', [req.user.id]);
            
            if (!locatario || locatario.id !== locacao.locatario_id) {
                return res.status(403).json({ error: 'Você não tem permissão para acessar esta locação' });
            }
        }
        
        res.json(locacao);
    } catch (error) {
        console.error('Erro ao buscar locação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas para Avaliações
app.post('/api/avaliacoes/locadora', authenticateToken, checkPermission('avaliar_locatario'), async (req, res) => {
    try {
        const { locacao_id, nota, comentario, valor_prejuizo } = req.body;
        
        // Verificar campos obrigatórios
        if (!locacao_id || !nota || !comentario) {
            return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }
        
        // Verificar se a nota está no intervalo válido
        if (nota < 1 || nota > 5) {
            return res.status(400).json({ error: 'A nota deve estar entre 1 e 5' });
        }
        
        // Verificar se a locação existe
        const locacao = await db.queryOne('SELECT * FROM locacoes WHERE id = ?', [locacao_id]);
        
        if (!locacao) {
            return res.status(404).json({ error: 'Locação não encontrada' });
        }
        
        // Verificar se o usuário é a locadora da locação
        const locadora = await db.queryOne('SELECT id FROM locadoras WHERE usuario_id = ?', [req.user.id]);
        
        if (!locadora || locadora.id !== locacao.locadora_id) {
            return res.status(403).json({ error: 'Você não tem permissão para avaliar esta locação' });
        }
        
        // Verificar se já existe uma avaliação
        const existingAvaliacao = await db.queryOne('SELECT * FROM avaliacoes_locadora WHERE locacao_id = ?', [locacao_id]);
        
        if (existingAvaliacao) {
            return res.status(400).json({ error: 'Esta locação já foi avaliada' });
        }
        
        // Verificar se a locação está ativa ou finalizada
        const locacaoAtiva = locacao.status === 'ativa';
        
        // Inserir avaliação
        const avaliacaoId = await db.insert('avaliacoes_locadora', {
            locacao_id,
            nota,
            comentario,
            valor_prejuizo: valor_prejuizo || 0,
            locacao_ativa: locacaoAtiva ? 1 : 0,
            data_avaliacao: new Date()
        });
        
        res.status(201).json({
            message: 'Avaliação cadastrada com sucesso',
            avaliacao_id: avaliacaoId
        });
    } catch (error) {
        console.error('Erro ao cadastrar avaliação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/avaliacoes/locatario', authenticateToken, checkPermission('avaliar_locadora'), async (req, res) => {
    try {
        const { locacao_id, nota, comentario } = req.body;
        
        // Verificar campos obrigatórios
        if (!locacao_id || !nota || !comentario) {
            return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }
        
        // Verificar se a nota está no intervalo válido
        if (nota < 1 || nota > 5) {
            return res.status(400).json({ error: 'A nota deve estar entre 1 e 5' });
        }
        
        // Verificar se a locação existe
        const locacao = await db.queryOne('SELECT * FROM locacoes WHERE id = ?', [locacao_id]);
        
        if (!locacao) {
            return res.status(404).json({ error: 'Locação não encontrada' });
        }
        
        // Verificar se o usuário é o locatário da locação
        const locatario = await db.queryOne('SELECT id FROM locatarios WHERE usuario_id = ?', [req.user.id]);
        
        if (!locatario || locatario.id !== locacao.locatario_id) {
            return res.status(403).json({ error: 'Você não tem permissão para avaliar esta locação' });
        }
        
        // Verificar se já existe uma avaliação
        const existingAvaliacao = await db.queryOne('SELECT * FROM avaliacoes_locatario WHERE locacao_id = ?', [locacao_id]);
        
        if (existingAvaliacao) {
            return res.status(400).json({ error: 'Esta locação já foi avaliada' });
        }
        
        // Verificar se a locação está ativa ou finalizada
        const locacaoAtiva = locacao.status === 'ativa';
        
        // Inserir avaliação
        const avaliacaoId = await db.insert('avaliacoes_locatario', {
            locacao_id,
            nota,
            comentario,
            locacao_ativa: locacaoAtiva ? 1 : 0,
            data_avaliacao: new Date()
        });
        
        res.status(201).json({
            message: 'Avaliação cadastrada com sucesso',
            avaliacao_id: avaliacaoId
        });
    } catch (error) {
        console.error('Erro ao cadastrar avaliação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/avaliacoes/locadora', async (req, res) => {
    try {
        const { locadora_id } = req.query;
        
        if (!locadora_id) {
            return res.status(400).json({ error: 'ID da locadora é obrigatório' });
        }
        
        // Buscar avaliações da locadora
        const avaliacoes = await db.query(`
            SELECT al.*, l.locadora_id, l.locatario_id, l.data_inicio, l.data_fim, lt.nome_completo as locatario_nome
            FROM avaliacoes_locatario al
            JOIN locacoes l ON al.locacao_id = l.id
            JOIN locatarios lt ON l.locatario_id = lt.id
            WHERE l.locadora_id = ?
        `, [locadora_id]);
        
        res.json(avaliacoes);
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/avaliacoes/locatario', async (req, res) => {
    try {
        const { locatario_id } = req.query;
        
        if (!locatario_id) {
            return res.status(400).json({ error: 'ID do locatário é obrigatório' });
        }
        
        // Buscar avaliações do locatário
        const avaliacoes = await db.query(`
            SELECT al.*, l.locadora_id, l.locatario_id, l.data_inicio, l.data_fim, lc.nome_fantasia as locadora_nome
            FROM avaliacoes_locadora al
            JOIN locacoes l ON al.locacao_id = l.id
            JOIN locadoras lc ON l.locadora_id = lc.id
            WHERE l.locatario_id = ?
        `, [locatario_id]);
        
        res.json(avaliacoes);
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para consulta pública de avaliações
app.get('/api/consulta/locadora/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar dados da locadora
        const locadora = await db.queryOne('SELECT * FROM locadoras WHERE id = ? AND ativo = 1', [id]);
        
        if (!locadora) {
            return res.status(404).json({ error: 'Locadora não encontrada' });
        }
        
        // Buscar avaliações da locadora
        const avaliacoes = await db.query(`
            SELECT al.nota, al.comentario, al.data_avaliacao, l.data_inicio, l.data_fim
            FROM avaliacoes_locatario al
            JOIN locacoes l ON al.locacao_id = l.id
            WHERE l.locadora_id = ?
            ORDER BY al.data_avaliacao DESC
        `, [id]);
        
        // Calcular média das avaliações
        let mediaAvaliacoes = 0;
        if (avaliacoes.length > 0) {
            const somaNotas = avaliacoes.reduce((soma, avaliacao) => soma + avaliacao.nota, 0);
            mediaAvaliacoes = somaNotas / avaliacoes.length;
        }
        
        res.json({
            locadora: {
                id: locadora.id,
                nome_fantasia: locadora.nome_fantasia,
                cidade: locadora.cidade,
                estado: locadora.estado
            },
            avaliacoes,
            media_avaliacoes: mediaAvaliacoes,
            total_avaliacoes: avaliacoes.length
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações da locadora:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/consulta/locatario/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar dados do locatário
        const locatario = await db.queryOne('SELECT * FROM locatarios WHERE id = ? AND ativo = 1', [id]);
        
        if (!locatario) {
            return res.status(404).json({ error: 'Locatário não encontrado' });
        }
        
        // Buscar avaliações do locatário
        const avaliacoes = await db.query(`
            SELECT al.nota, al.comentario, al.valor_prejuizo, al.data_avaliacao, l.data_inicio, l.data_fim
            FROM avaliacoes_locadora al
            JOIN locacoes l ON al.locacao_id = l.id
            WHERE l.locatario_id = ?
            ORDER BY al.data_avaliacao DESC
        `, [id]);
        
        // Calcular média das avaliações
        let mediaAvaliacoes = 0;
        let totalPrejuizo = 0;
        if (avaliacoes.length > 0) {
            const somaNotas = avaliacoes.reduce((soma, avaliacao) => soma + avaliacao.nota, 0);
            mediaAvaliacoes = somaNotas / avaliacoes.length;
            totalPrejuizo = avaliacoes.reduce((soma, avaliacao) => soma + (avaliacao.valor_prejuizo || 0), 0);
        }
        
        res.json({
            locatario: {
                id: locatario.id,
                nome: locatario.nome_completo,
                cidade: locatario.cidade,
                estado: locatario.estado
            },
            avaliacoes,
            media_avaliacoes: mediaAvaliacoes,
            total_avaliacoes: avaliacoes.length,
            total_prejuizo: totalPrejuizo
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações do locatário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para verificar status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date(),
        version: '1.0.0'
    });
});

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promessa rejeitada não tratada:', reason);
});

module.exports = app;
