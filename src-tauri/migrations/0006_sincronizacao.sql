-- ==========================================================================
-- Print 360 — Migration 0006: sincronização entre instalações (recursos avançados / M3)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS instalacoes (
    id                    TEXT PRIMARY KEY,
    nome                  TEXT NOT NULL,
    site                  TEXT,
    status                TEXT NOT NULL DEFAULT 'ativo'
                          CHECK (status IN ('ativo','inativo')),
    ultima_sincronizacao  DATETIME,
    token_hash            TEXT,
    criada_em             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS versoes_entidade (
    entidade    TEXT NOT NULL,
    entidade_id INTEGER NOT NULL,
    versao      INTEGER NOT NULL,
    origem      TEXT NOT NULL,
    payload     TEXT NOT NULL,
    atualizada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (entidade, entidade_id)
);

CREATE TABLE IF NOT EXISTS outbox (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    instalacao_origem TEXT NOT NULL REFERENCES instalacoes(id),
    entidade          TEXT NOT NULL,
    entidade_id       INTEGER NOT NULL,
    versao            INTEGER NOT NULL,
    operacao          TEXT NOT NULL CHECK (operacao IN ('insert','update','delete')),
    payload_json      TEXT NOT NULL,
    processado        INTEGER NOT NULL DEFAULT 0,
    criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instalacao_origem, entidade, entidade_id, versao)
);
CREATE INDEX IF NOT EXISTS idx_outbox_pendente ON outbox(processado, criado_em);

CREATE TABLE IF NOT EXISTS sincronizacoes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    instalacao_id  TEXT NOT NULL REFERENCES instalacoes(id),
    direcao        TEXT NOT NULL CHECK (direcao IN ('envio','recebimento')),
    itens          INTEGER NOT NULL DEFAULT 0,
    duracao_ms     INTEGER NOT NULL DEFAULT 0,
    status         TEXT NOT NULL CHECK (status IN ('sucesso','erro','parcial')),
    detalhe        TEXT,
    realizada_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conflitos_sincronizacao (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    entidade           TEXT NOT NULL,
    entidade_id        INTEGER NOT NULL,
    versao_remota      INTEGER NOT NULL DEFAULT 0,
    versao_local_json  TEXT NOT NULL,
    versao_remota_json TEXT NOT NULL,
    estado             TEXT NOT NULL DEFAULT 'pendente'
                       CHECK (estado IN ('pendente','resolvido_local','resolvido_remoto')),
    detectado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entidade, entidade_id, versao_remota)
);

INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES
  ('f2_sync_ativa', 'false', 'Habilita sincronização entre instalações'),
  ('f2_sync_intervalo_min', '15', 'Intervalo entre sincronizações'),
  ('f2_sync_conflito_policy', 'manual', 'Política: manual | recente | origem'),
  ('f2_sync_transporte', 'arquivo', 'Transporte: arquivo | http'),
  ('f2_sync_url', '', 'URL base do transporte HTTP'),
  ('f2_sync_token', '', 'Token de autenticação do transporte HTTP'),
  ('f2_instalacao_id', 'matriz-sp', 'Identificador desta instalação');
INSERT OR IGNORE INTO instalacoes (id, nome, site, status) VALUES
  ('matriz-sp', 'Matriz — São Paulo', 'SP', 'ativo');
