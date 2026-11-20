use rusqlite::{params, Connection};

use crate::{
    erro::{AppError, AppResult},
    modelos::{Alerta, DetalhesImpressora, ManutencaoResumo, Suprimento, TrabalhoResumo},
};

/// Monta a ficha completa de uma impressora a partir de dados persistidos (RF-004).
pub fn obter_detalhes(conexao: &Connection, impressora_id: i64) -> AppResult<DetalhesImpressora> {
    let impressora: Option<(String, Option<String>, Option<String>, Option<String>, Option<String>,
                             String, String, Option<String>, Option<String>)> = conexao
        .query_row(
            "SELECT i.nome, i.modelo, i.numero_serie, i.firmware, i.endereco,
                    i.status, i.origem, i.localizacao, i.ultima_vista
             FROM impressoras i WHERE i.id = ?1",
            params![impressora_id],
            |linha| Ok((linha.get(0)?, linha.get(1)?, linha.get(2)?, linha.get(3)?,
                        linha.get(4)?, linha.get(5)?, linha.get(6)?, linha.get(7)?, linha.get(8)?)),
        )
        .ok();

    let Some((nome, modelo, numero_serie, firmware, endereco, status, origem, localizacao, ultima_vista)) = impressora else {
        return Err(AppError::NaoEncontrado(format!("impressora {} não encontrada", impressora_id)));
    };

    let setor: Option<String> = conexao
        .query_row(
            "SELECT s.nome FROM setores s JOIN impressoras i ON i.setor_id = s.id WHERE i.id = ?1",
            params![impressora_id],
            |linha| linha.get(0),
        )
        .ok();

    let mut declaracao = conexao.prepare(
        "SELECT f.id, f.documento, COALESCE(u.nome, ''), f.paginas, f.status, f.criado_em
         FROM fila_impressao f LEFT JOIN usuarios u ON u.id = f.usuario_id
         WHERE f.impressora_id = ?1 ORDER BY f.criado_em DESC LIMIT 10",
    )?;
    let trabalhos = declaracao.query_map(params![impressora_id], |linha| {
        Ok(TrabalhoResumo {
            id: linha.get(0)?,
            documento: linha.get(1)?,
            usuario: linha.get(2)?,
            paginas: linha.get(3)?,
            status: linha.get(4)?,
            criado_em: linha.get(5)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    drop(declaracao);

    let mut declaracao = conexao.prepare(
        "SELECT id, tipo, severidade, titulo, mensagem, resolvido, criado_em
         FROM alertas WHERE impressora_id = ?1 AND resolvido = 0
         ORDER BY criado_em DESC LIMIT 10",
    )?;
    let alertas = declaracao.query_map(params![impressora_id], |linha| {
        Ok(Alerta {
            id: linha.get(0)?,
            tipo: linha.get(1)?,
            severidade: linha.get(2)?,
            titulo: linha.get(3)?,
            mensagem: linha.get(4)?,
            impressora: Some(nome.clone()),
            resolvido: linha.get::<_, i64>(5)? != 0,
            criado_em: linha.get(6)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    drop(declaracao);

    let mut declaracao = conexao.prepare(
        "SELECT id, titulo, COALESCE(prioridade, ''), COALESCE(responsavel, ''),
                COALESCE(data_prevista, ''), status, COALESCE(custo_estimado, 0)
         FROM ordens_servico WHERE impressora_id = ?1
         ORDER BY criada_em DESC LIMIT 10",
    )?;
    let manutencoes = declaracao.query_map(params![impressora_id], |linha| {
        Ok(ManutencaoResumo {
            id: linha.get(0)?,
            titulo: linha.get(1)?,
            tipo: linha.get(2)?,
            responsavel: linha.get(3)?,
            data_prevista: linha.get(4)?,
            status: linha.get(5)?,
            custo_estimado: linha.get(6)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    drop(declaracao);

    let mut declaracao = conexao.prepare(
        "SELECT id, tipo, nivel, capacidade, ultima_troca
         FROM suprimentos WHERE impressora_id = ?1 ORDER BY tipo",
    )?;
    let suprimentos = declaracao.query_map(params![impressora_id], |linha| {
        let tipo: String = linha.get(1)?;
        Ok(Suprimento {
            id: linha.get(0)?,
            impressora_id,
            impressora: nome.clone(),
            tipo_rotulo: match tipo.as_str() {
                "toner_preto" => "Toner preto",
                "toner_ciano" => "Toner ciano",
                "toner_magenta" => "Toner magenta",
                "toner_amarelo" => "Toner amarelo",
                "tambor" => "Tambor",
                "papel" => "Papel",
                "grampo" => "Grampos",
                _ => "Suprimento",
            }.to_string(),
            tipo,
            nivel: linha.get(2)?,
            capacidade: linha.get(3)?,
            previsao_dias: None,
            ultima_troca: linha.get(4)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(DetalhesImpressora {
        impressora_id,
        nome,
        modelo,
        numero_serie,
        firmware,
        endereco,
        localizacao,
        setor,
        status,
        origem,
        ultima_vista,
        trabalhos,
        alertas,
        manutencoes,
        suprimentos,
    })
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;

    #[test]
    fn detalhes_inclui_dados_relacionados() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute(
            "INSERT INTO impressoras (nome, numero_serie, status, origem) VALUES ('Impressora 01', 'SER-1', 'pronta', 'spooler')",
            [],
        ).unwrap();
        conexao.execute(
            "INSERT INTO suprimentos (impressora_id, tipo, nivel) VALUES (1, 'papel', 80)",
            [],
        ).unwrap();
        conexao.execute(
            "INSERT INTO alertas (tipo, titulo, impressora_id) VALUES ('erro_impressora', 'Falha', 1)",
            [],
        ).unwrap();

        let detalhes = obter_detalhes(&conexao, 1).unwrap();
        assert_eq!(detalhes.nome, "Impressora 01");
        assert_eq!(detalhes.numero_serie.as_deref(), Some("SER-1"));
        assert_eq!(detalhes.suprimentos.len(), 1);
        assert_eq!(detalhes.alertas.len(), 1);
        assert!(obter_detalhes(&conexao, 999).is_err());
    }
}
