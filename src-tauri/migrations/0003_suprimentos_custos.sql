-- ==========================================================================
-- Print 360 — Migration 0003: suprimentos, custos e cotas
-- ==========================================================================

ALTER TABLE fila_impressao ADD COLUMN colorida INTEGER NOT NULL DEFAULT 0;

-- Cota por usuário: único (linhas por setor têm usuario_id NULL, permitidas pelo índice).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cotas_usuario ON cotas(usuario_id);

INSERT OR IGNORE INTO setores (nome) VALUES
    ('Tecnologia'), ('Financeiro'), ('Marketing'), ('Recursos Humanos'),
    ('Diretoria'), ('Engenharia'), ('Jurídico');

INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES
    ('limite_nivel_baixo', '20', 'Percentual mínimo para gerar alerta de suprimento'),
    ('alertas_suprimento', 'true', 'Habilita alertas de suprimento baixo'),
    ('alertas_cota', 'true', 'Habilita alertas de cota excedida'),
    ('notificacoes', 'true', 'Habilita notificações nativas do sistema');
