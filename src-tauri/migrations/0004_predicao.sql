-- ==========================================================================
-- Print 360 — Migration 0004: manutenção preditiva (recursos avançados / M1)
-- Fonte: 05_avancado/arquitetura/modelo_dados_avancado.md
-- ==========================================================================

CREATE TABLE IF NOT EXISTS saude_dispositivo (
    impressora_id INTEGER PRIMARY KEY REFERENCES impressoras(id) ON DELETE CASCADE,
    pontuacao     INTEGER NOT NULL CHECK (pontuacao BETWEEN 0 AND 100),
    classificacao TEXT NOT NULL CHECK (classificacao IN ('excelente','bom','atencao','critico')),
    confianca     REAL NOT NULL DEFAULT 0 CHECK (confianca BETWEEN 0 AND 1),
    fatores_json  TEXT NOT NULL DEFAULT '[]',
    calculado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS previsoes_falha (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    impressora_id  INTEGER NOT NULL REFERENCES impressoras(id) ON DELETE CASCADE,
    componente     TEXT NOT NULL,
    dias_previstos INTEGER NOT NULL,
    probabilidade  REAL NOT NULL CHECK (probabilidade BETWEEN 0 AND 1),
    confianca      TEXT NOT NULL CHECK (confianca IN ('baixa','media','alta')),
    fatores_json   TEXT NOT NULL DEFAULT '[]',
    resolvida      INTEGER NOT NULL DEFAULT 0,
    previsto_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_previsoes_impressora
    ON previsoes_falha(impressora_id, resolvida);

CREATE TABLE IF NOT EXISTS ordens_servico (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    impressora_id   INTEGER NOT NULL REFERENCES impressoras(id) ON DELETE CASCADE,
    previsao_id     INTEGER REFERENCES previsoes_falha(id) ON DELETE SET NULL,
    titulo          TEXT NOT NULL,
    prioridade      TEXT NOT NULL DEFAULT 'media'
                    CHECK (prioridade IN ('baixa','media','alta','critica')),
    status          TEXT NOT NULL DEFAULT 'planejada'
                    CHECK (status IN ('planejada','agendada','em_execucao','concluida','cancelada')),
    responsavel     TEXT,
    data_prevista   DATE,
    custo_estimado  REAL,
    criada_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluida_em    DATETIME
);

INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES
  ('f2_predicao_ativa', 'false', 'Habilita manutenção preditiva'),
  ('f2_horizonte_dias', '30', 'Horizonte padrão das previsões'),
  ('f2_confianca_minima', '0.7', 'Confiança mínima para gerar recomendação');
