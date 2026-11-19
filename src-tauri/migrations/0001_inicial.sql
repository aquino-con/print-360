-- ==========================================================================
-- Print 360 — Migration inicial
-- Aquino Consultoria
-- Fonte: 01_planejamento/arquitetura/modelo_dados.md
-- ==========================================================================

CREATE TABLE IF NOT EXISTS setores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL UNIQUE,
    descricao   TEXT,
    criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    login       TEXT NOT NULL UNIQUE,
    email       TEXT,
    setor_id    INTEGER REFERENCES setores(id) ON DELETE SET NULL,
    perfil      TEXT NOT NULL DEFAULT 'usuario'
                CHECK (perfil IN ('administrador','gestor','usuario')),
    ativo       INTEGER NOT NULL DEFAULT 1,
    criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS impressoras (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nome            TEXT NOT NULL,
    modelo          TEXT,
    fabricante      TEXT,
    numero_serie    TEXT UNIQUE,
    endereco        TEXT,
    localizacao     TEXT,
    setor_id        INTEGER REFERENCES setores(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'desconhecido'
                    CHECK (status IN ('pronta','ocupada','erro','pausada',
                                      'offline','manutencao','desconhecido')),
    firmware        TEXT,
    ultima_vista     DATETIME,
    criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fila_impressao (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    documento       TEXT NOT NULL,
    usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    impressora_id   INTEGER NOT NULL REFERENCES impressoras(id),
    paginas         INTEGER NOT NULL DEFAULT 0,
    copias          INTEGER NOT NULL DEFAULT 1,
    tamanho_bytes   INTEGER,
    prioridade      INTEGER NOT NULL DEFAULT 5,
    status          TEXT NOT NULL
                    CHECK (status IN ('pendente','processando','pausado',
                                      'concluido','cancelado','erro')),
    progresso       INTEGER NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
    custo_estimado  REAL NOT NULL DEFAULT 0,
    criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iniciado_em     DATETIME,
    concluido_em    DATETIME
);
CREATE INDEX IF NOT EXISTS idx_fila_status ON fila_impressao(status);
CREATE INDEX IF NOT EXISTS idx_fila_impressora ON fila_impressao(impressora_id);
CREATE INDEX IF NOT EXISTS idx_fila_criado ON fila_impressao(criado_em);

CREATE TABLE IF NOT EXISTS eventos_fila (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trabalho_id INTEGER NOT NULL REFERENCES fila_impressao(id) ON DELETE CASCADE,
    acao        TEXT NOT NULL,
    detalhe     TEXT,
    registro_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suprimentos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    impressora_id   INTEGER NOT NULL REFERENCES impressoras(id) ON DELETE CASCADE,
    tipo            TEXT NOT NULL
                    CHECK (tipo IN ('toner_preto','toner_ciano','toner_magenta',
                                    'toner_amarelo','tambor','papel','grampo')),
    nivel           INTEGER NOT NULL CHECK (nivel BETWEEN 0 AND 100),
    capacidade      INTEGER,
    ultima_troca    DATETIME,
    atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(impressora_id, tipo)
);

CREATE TABLE IF NOT EXISTS manutencoes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    impressora_id   INTEGER NOT NULL REFERENCES impressoras(id) ON DELETE CASCADE,
    tipo            TEXT NOT NULL,
    descricao       TEXT,
    responsavel     TEXT,
    custo           REAL,
    realizada_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cotas (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id        INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    setor_id          INTEGER REFERENCES setores(id) ON DELETE CASCADE,
    limite_paginas    INTEGER NOT NULL,
    consumido         INTEGER NOT NULL DEFAULT 0,
    periodo           TEXT NOT NULL DEFAULT 'mensal',
    inicio_periodo    DATE NOT NULL,
    bloquear_excesso  INTEGER NOT NULL DEFAULT 0,
    CHECK (usuario_id IS NOT NULL OR setor_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS parametros_custo (
    id                  INTEGER PRIMARY KEY CHECK (id = 1),
    custo_pagina_preto  REAL NOT NULL DEFAULT 0.25,
    custo_pagina_cor    REAL NOT NULL DEFAULT 0.85,
    custo_toner         REAL NOT NULL DEFAULT 0.0,
    custo_papel         REAL NOT NULL DEFAULT 0.0,
    margem_manutencao   REAL NOT NULL DEFAULT 0.0,
    moeda               TEXT NOT NULL DEFAULT 'BRL',
    atualizado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO parametros_custo (id) VALUES (1);

CREATE TABLE IF NOT EXISTS alertas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo            TEXT NOT NULL
                    CHECK (tipo IN ('suprimento_baixo','erro_impressora',
                                    'fila_travada','cota_excedida','manutencao')),
    severidade      TEXT NOT NULL DEFAULT 'aviso'
                    CHECK (severidade IN ('info','aviso','critico')),
    titulo          TEXT NOT NULL,
    mensagem        TEXT,
    impressora_id   INTEGER REFERENCES impressoras(id) ON DELETE SET NULL,
    resolvido       INTEGER NOT NULL DEFAULT 0,
    criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolvido_em    DATETIME
);
CREATE INDEX IF NOT EXISTS idx_alertas_resolvido ON alertas(resolvido);

CREATE TABLE IF NOT EXISTS configuracoes (
    chave       TEXT PRIMARY KEY,
    valor       TEXT NOT NULL,
    descricao   TEXT
);

CREATE TABLE IF NOT EXISTS auditoria (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    acao        TEXT NOT NULL,
    entidade    TEXT NOT NULL,
    entidade_id INTEGER,
    detalhe     TEXT,
    registro_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metricas_diarias (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    data            DATE NOT NULL,
    impressora_id   INTEGER REFERENCES impressoras(id) ON DELETE CASCADE,
    setor_id        INTEGER REFERENCES setores(id) ON DELETE CASCADE,
    paginas_preto   INTEGER NOT NULL DEFAULT 0,
    paginas_cor     INTEGER NOT NULL DEFAULT 0,
    custo_total     REAL NOT NULL DEFAULT 0,
    UNIQUE(data, impressora_id, setor_id)
);
