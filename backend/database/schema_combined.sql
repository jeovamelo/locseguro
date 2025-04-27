-- Esquema Combinado do Banco de Dados para o Sistema LOC Seguro

-- Tabela de usuários (comum para locadoras e locatários)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('locadora', 'locatario')),
    cadastro_completo BOOLEAN DEFAULT 0,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP,
    token_reset_senha TEXT,
    token_expiracao TIMESTAMP,
    ativo BOOLEAN DEFAULT 1
);

-- Tabela de Locadoras (Empresas)
CREATE TABLE IF NOT EXISTS locadoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER REFERENCES usuarios(id),
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    inscricao_estadual TEXT,
    cep TEXT NOT NULL,
    rua TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL,
    telefone_comercial TEXT NOT NULL,
    email_comercial TEXT NOT NULL UNIQUE,
    
    -- Dados do Responsável Legal
    responsavel_nome TEXT NOT NULL,
    responsavel_cpf TEXT NOT NULL,
    responsavel_data_nascimento DATE NOT NULL,
    responsavel_telefone TEXT NOT NULL,
    responsavel_email TEXT NOT NULL,
    
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Locatários (Pessoas Físicas)
CREATE TABLE IF NOT EXISTS locatarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER REFERENCES usuarios(id),
    nome_completo TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    
    -- Endereço
    cep TEXT NOT NULL,
    rua TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL,
    
    -- Dados da CNH
    cnh_numero TEXT NOT NULL UNIQUE,
    cnh_categoria TEXT NOT NULL,
    cnh_data_emissao DATE NOT NULL,
    cnh_validade DATE NOT NULL,
    cnh_orgao_emissor TEXT NOT NULL,
    cnh_uf_emissao TEXT NOT NULL,
    
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Carros
CREATE TABLE IF NOT EXISTS carros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locadora_id INTEGER NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    ano_fabricacao INTEGER NOT NULL,
    ano_modelo INTEGER NOT NULL,
    cor TEXT NOT NULL,
    placa TEXT NOT NULL UNIQUE,
    chassi TEXT,
    quilometragem REAL NOT NULL,
    valor_diaria REAL NOT NULL,
    observacoes TEXT,
    disponivel BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (locadora_id) REFERENCES locadoras(id)
);

-- Tabela de Fotos dos Carros
CREATE TABLE IF NOT EXISTS fotos_carros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carro_id INTEGER NOT NULL,
    url_foto TEXT NOT NULL,
    descricao TEXT,
    
    FOREIGN KEY (carro_id) REFERENCES carros(id)
);

-- Tabela de Locações
CREATE TABLE IF NOT EXISTS locacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carro_id INTEGER NOT NULL,
    locadora_id INTEGER NOT NULL,
    locatario_id INTEGER NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    valor_total REAL NOT NULL,
    observacoes TEXT,
    retroativa BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'ativa', -- ativa, finalizada, cancelada
    status_solicitacao TEXT DEFAULT 'aprovada' CHECK (status_solicitacao IN ('pendente', 'aprovada', 'rejeitada')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (carro_id) REFERENCES carros(id),
    FOREIGN KEY (locadora_id) REFERENCES locadoras(id),
    FOREIGN KEY (locatario_id) REFERENCES locatarios(id)
);

-- Tabela de Avaliações da Locadora sobre o Locatário
CREATE TABLE IF NOT EXISTS avaliacoes_locadora (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locacao_id INTEGER NOT NULL UNIQUE,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    valor_prejuizo REAL DEFAULT 0,
    locacao_ativa BOOLEAN DEFAULT 0,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (locacao_id) REFERENCES locacoes(id)
);

-- Tabela de Avaliações do Locatário sobre a Locadora
CREATE TABLE IF NOT EXISTS avaliacoes_locatario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locacao_id INTEGER NOT NULL UNIQUE,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    locacao_ativa BOOLEAN DEFAULT 0,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (locacao_id) REFERENCES locacoes(id)
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    token TEXT NOT NULL UNIQUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Tabela de permissões
CREATE TABLE IF NOT EXISTS permissoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT
);

-- Tabela de relacionamento entre tipos de usuário e permissões
CREATE TABLE IF NOT EXISTS tipo_usuario_permissoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('locadora', 'locatario')),
    permissao_id INTEGER NOT NULL REFERENCES permissoes(id),
    UNIQUE(tipo_usuario, permissao_id)
);

-- Inserir permissões básicas
INSERT OR IGNORE INTO permissoes (nome, descricao) VALUES
('cadastrar_carro', 'Permissão para cadastrar carros'),
('cadastrar_locacao', 'Permissão para cadastrar locações'),
('avaliar_locatario', 'Permissão para avaliar locatários'),
('consultar_locatarios', 'Permissão para consultar avaliações de locatários'),
('visualizar_reputacao_propria', 'Permissão para visualizar a própria reputação'),
('editar_dados_cadastrais', 'Permissão para editar dados cadastrais'),
('visualizar_historico_locacoes', 'Permissão para visualizar histórico de locações'),
('pesquisar_carros', 'Permissão para pesquisar carros'),
('solicitar_locacao', 'Permissão para solicitar locação'),
('avaliar_locadora', 'Permissão para avaliar locadoras'),
('consultar_locadoras', 'Permissão para consultar avaliações de locadoras');

-- Atribuir permissões para locadoras
INSERT OR IGNORE INTO tipo_usuario_permissoes (tipo_usuario, permissao_id) 
SELECT 'locadora', id FROM permissoes WHERE nome IN (
    'cadastrar_carro',
    'cadastrar_locacao',
    'avaliar_locatario',
    'consultar_locatarios',
    'visualizar_reputacao_propria',
    'editar_dados_cadastrais',
    'visualizar_historico_locacoes'
);

-- Atribuir permissões para locatários
INSERT OR IGNORE INTO tipo_usuario_permissoes (tipo_usuario, permissao_id) 
SELECT 'locatario', id FROM permissoes WHERE nome IN (
    'pesquisar_carros',
    'solicitar_locacao',
    'avaliar_locadora',
    'consultar_locadoras',
    'visualizar_reputacao_propria',
    'editar_dados_cadastrais',
    'visualizar_historico_locacoes'
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_locacoes_carro ON locacoes(carro_id);
CREATE INDEX IF NOT EXISTS idx_locacoes_locadora ON locacoes(locadora_id);
CREATE INDEX IF NOT EXISTS idx_locacoes_locatario ON locacoes(locatario_id);
CREATE INDEX IF NOT EXISTS idx_carros_locadora ON carros(locadora_id);
CREATE INDEX IF NOT EXISTS idx_fotos_carro ON fotos_carros(carro_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_locadoras_usuario_id ON locadoras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_locatarios_usuario_id ON locatarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes(usuario_id);
