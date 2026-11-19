-- ==========================================================================
-- Print 360 — Migration 0002: integração com spooler
-- ==========================================================================

ALTER TABLE impressoras ADD COLUMN origem TEXT NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS idx_impressoras_nome
    ON impressoras(nome);

ALTER TABLE fila_impressao ADD COLUMN id_sistema TEXT;

-- Índice único completo (não parcial): índices parciais não podem ser usados
-- como alvo de ON CONFLICT no UPSERT do SQLite.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fila_id_sistema_unico
    ON fila_impressao(id_sistema);

CREATE INDEX IF NOT EXISTS idx_fila_status_progresso
    ON fila_impressao(status, progresso);
