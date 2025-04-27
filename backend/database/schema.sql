-- Esquema do Banco de Dados para o Sistema LOC Seguro

-- Tabela de Usuários (base para Locadoras e Locatários)
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('locadora', 'locatario') NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    perfil_completo BOOLEAN DEFAULT FALSE,
    ultimo_acesso TIMESTAMP
);

-- Tabela de Locadoras
CREATE TABLE locadoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    razao_social VARCHAR(100) NOT NULL,
    nome_fantasia VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    responsavel VARCHAR(100) NOT NULL,
    email_contato VARCHAR(100) NOT NULL,
    avaliacao_media DECIMAL(3,2) DEFAULT 0,
    total_avaliacoes INTEGER DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Locatários
CREATE TABLE locatarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    cnh VARCHAR(20) NOT NULL,
    categoria_cnh VARCHAR(5) NOT NULL,
    validade_cnh DATE NOT NULL,
    avaliacao_media DECIMAL(3,2) DEFAULT 0,
    total_avaliacoes INTEGER DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Carros
CREATE TABLE carros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locadora_id INTEGER NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    ano INTEGER NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    cor VARCHAR(30) NOT NULL,
    quilometragem INTEGER NOT NULL,
    valor_diaria DECIMAL(10,2) NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    descricao TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (locadora_id) REFERENCES locadoras(id) ON DELETE CASCADE
);

-- Tabela de Locações
CREATE TABLE locacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carro_id INTEGER NOT NULL,
    locadora_id INTEGER NOT NULL,
    locatario_id INTEGER NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    status ENUM('agendada', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'agendada',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    FOREIGN KEY (carro_id) REFERENCES carros(id) ON DELETE RESTRICT,
    FOREIGN KEY (locadora_id) REFERENCES locadoras(id) ON DELETE RESTRICT,
    FOREIGN KEY (locatario_id) REFERENCES locatarios(id) ON DELETE RESTRICT
);

-- Tabela de Avaliações de Locadoras
CREATE TABLE avaliacoes_locadoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locacao_id INTEGER NOT NULL,
    locatario_id INTEGER NOT NULL,
    locadora_id INTEGER NOT NULL,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (locacao_id) REFERENCES locacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (locatario_id) REFERENCES locatarios(id) ON DELETE CASCADE,
    FOREIGN KEY (locadora_id) REFERENCES locadoras(id) ON DELETE CASCADE
);

-- Tabela de Avaliações de Locatários
CREATE TABLE avaliacoes_locatarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locacao_id INTEGER NOT NULL,
    locadora_id INTEGER NOT NULL,
    locatario_id INTEGER NOT NULL,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    prejuizo BOOLEAN DEFAULT FALSE,
    valor_prejuizo DECIMAL(10,2),
    descricao_prejuizo TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (locacao_id) REFERENCES locacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (locadora_id) REFERENCES locadoras(id) ON DELETE CASCADE,
    FOREIGN KEY (locatario_id) REFERENCES locatarios(id) ON DELETE CASCADE
);

-- Índices para melhorar a performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_locadoras_usuario_id ON locadoras(usuario_id);
CREATE INDEX idx_locatarios_usuario_id ON locatarios(usuario_id);
CREATE INDEX idx_carros_locadora_id ON carros(locadora_id);
CREATE INDEX idx_locacoes_carro_id ON locacoes(carro_id);
CREATE INDEX idx_locacoes_locadora_id ON locacoes(locadora_id);
CREATE INDEX idx_locacoes_locatario_id ON locacoes(locatario_id);
CREATE INDEX idx_avaliacoes_locadoras_locacao_id ON avaliacoes_locadoras(locacao_id);
CREATE INDEX idx_avaliacoes_locatarios_locacao_id ON avaliacoes_locatarios(locacao_id);
