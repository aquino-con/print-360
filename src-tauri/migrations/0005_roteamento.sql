-- ==========================================================================
-- Print 360 — Migration 0005: roteamento inteligente (recursos avançados / M2)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS regras_roteamento (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL,
    prioridade    INTEGER NOT NULL DEFAULT 100,
    condicoes_json TEXT NOT NULL DEFAULT '[]',
    acao_json     TEXT NOT NULL DEFAULT '{}',
    ativa         INTEGER NOT NULL DEFAULT 1,
    criada_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_regras_prioridade ON regras_roteamento(prioridade, ativa);

CREATE TABLE IF NOT EXISTS execucoes_roteamento (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    trabalho_id        INTEGER NOT NULL REFERENCES fila_impressao(id) ON DELETE CASCADE,
    regra_id           INTEGER REFERENCES regras_roteamento(id) ON DELETE SET NULL,
    impressora_destino INTEGER NOT NULL REFERENCES impressoras(id),
    justificativa_json TEXT NOT NULL DEFAULT '{}',
    decidido_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_execucoes_trabalho ON execucoes_roteamento(trabalho_id);

INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES
  ('f2_roteamento_ativo', 'false', 'Habilita roteamento automático'),
  ('f2_roteamento_criterio', 'disponibilidade', 'Critério padrão de escolha'),
  ('f2_roteamento_fallback_tentativas', '2', 'Número máximo de tentativas de fallback');
