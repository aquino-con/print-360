use rusqlite::Connection;

use crate::erro::AppResult;

use crate::modelos::AtividadeItem;

/// Monta o feed de atividade recente a partir de dados reais do banco (RF-023).
pub fn listar(conexao: &Connection, limite: i64) -> AppResult<Vec<AtividadeItem>> {
    let mut declaracao = conexao.prepare(
        "SELECT 'trabalho' AS tipo,
                'Trabalho ' || f.status || ' — ' || f.documento AS titulo,
                COALESCE(i.nome, 'Impressora removida') || ' · ' || f.paginas || ' páginas' AS detalhe,
                f.criado_em AS ocorrido_em
         FROM fila_impressao f
         LEFT JOIN impressoras i ON i.id = f.impressora_id
         UNION ALL
         SELECT 'alerta' AS tipo,
                a.titulo,
                COALESCE(a.mensagem, '') AS detalhe,
                a.criado_em AS ocorrido_em
         FROM alertas a
         UNION ALL
         SELECT 'manutencao' AS tipo,
                'Manutenção registrada — ' || m.titulo,
                COALESCE(i.nome, 'Impressora removida') AS detalhe,
                m.criada_em AS ocorrido_em
         FROM ordens_servico m
         LEFT JOIN impressoras i ON i.id = m.impressora_id
         ORDER BY ocorrido_em DESC
         LIMIT ?1",
    )?;
    let itens = declaracao.query_map(rusqlite::params![limite], |linha| {
        Ok(AtividadeItem {
            tipo: linha.get(0)?,
            titulo: linha.get(1)?,
            detalhe: linha.get(2)?,
            ocorrido_em: linha.get(3)?,
        })
    })?;
    itens.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}
