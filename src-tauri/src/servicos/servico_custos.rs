use std::collections::HashMap;

use rusqlite::{params, Connection};

use crate::{
    erro::AppResult,
    modelos::{ LinhaCusto, Ponto, Relatorio },
};

#[derive(Debug, Clone)]
struct Registro {
    paginas: i64,
    custo: f64,
    mes: String,
    setor: String,
    impressora: String,
}

/// Lê os parâmetros de custo (preto e branco, colorida).
pub fn obter_parametros(conexao: &Connection) -> AppResult<(f64, f64)> {
    conexao.query_row(
        "SELECT custo_pagina_preto, custo_pagina_cor FROM parametros_custo WHERE id = 1",
        [],
        |linha| Ok((linha.get(0)?, linha.get(1)?)),
    ).map_err(Into::into)
}

/// Salva os parâmetros de custo.
pub fn salvar_parametros(conexao: &Connection, preto: f64, cor: f64) -> AppResult<()> {
    conexao.execute(
        "UPDATE parametros_custo SET custo_pagina_preto = ?1, custo_pagina_cor = ?2,
                                     atualizado_em = CURRENT_TIMESTAMP WHERE id = 1",
        params![preto, cor],
    )?;
    Ok(())
}

/// Recalcula o custo estimado dos trabalhos que ainda não possuem custo (RF-019).
pub fn recalcular_pendentes(conexao: &mut Connection) -> AppResult<usize> {
    let (preto, cor) = obter_parametros(conexao)?;
    let transacao = conexao.transaction()?;
    transacao.execute(
        "UPDATE fila_impressao SET custo_estimado = ROUND(paginas * ?1, 2)
         WHERE custo_estimado = 0 AND colorida = 0",
        params![preto],
    )?;
    let coloridos = transacao.execute(
        "UPDATE fila_impressao SET custo_estimado = ROUND(paginas * ?1, 2)
         WHERE custo_estimado = 0 AND colorida = 1",
        params![cor],
    )?;
    transacao.commit()?;
    Ok(coloridos)
}

/// Agrega os dados do relatório gerencial (RF-020 / RF-021).
pub fn obter_relatorio(conexao: &Connection, meses: i64, setor: Option<&str>) -> AppResult<Relatorio> {
    let mut declaracao = conexao.prepare(
        "SELECT f.paginas, f.custo_estimado, strftime('%Y-%m', f.criado_em) AS mes,
                COALESCE(s.nome, 'Não informado') AS setor, i.nome AS impressora
         FROM fila_impressao f
         JOIN impressoras i ON i.id = f.impressora_id
         LEFT JOIN setores s ON s.id = i.setor_id
         WHERE f.status = 'concluido'
           AND f.criado_em >= date('now', '-' || ?1 || ' months')
         ORDER BY mes",
    )?;

    let registros: Vec<Registro> = declaracao
        .query_map(params![meses], |linha| {
            Ok(Registro {
                paginas: linha.get(0)?,
                custo: linha.get(1)?,
                mes: linha.get(2)?,
                setor: linha.get(3)?,
                impressora: linha.get(4)?,
            })
        })?
        .collect::<Result<_, _>>()?;
    drop(declaracao);

    let registros: Vec<Registro> = match setor {
        Some(filtro) => registros
            .into_iter()
            .filter(|registro| registro.setor.eq_ignore_ascii_case(filtro))
            .collect(),
        None => registros,
    };

    let paginas: i64 = registros.iter().map(|registro| registro.paginas).sum();
    let custo_total: f64 = registros.iter().map(|registro| registro.custo).sum();
    let custo_por_pagina = if paginas > 0 { custo_total / paginas as f64 } else { 0.0 };

    let mut por_mes: HashMap<String, f64> = HashMap::new();
    let mut por_setor: HashMap<String, f64> = HashMap::new();
    let mut por_impressora: HashMap<String, (i64, f64, String)> = HashMap::new();
    let mut variacao: HashMap<String, (f64, f64)> = HashMap::new(); // (atual, anterior)

    for registro in &registros {
        *por_mes.entry(registro.mes.clone()).or_default() += registro.custo;
        *por_setor.entry(registro.setor.clone()).or_default() += registro.custo;
        let entrada = por_impressora
            .entry(registro.impressora.clone())
            .or_insert((0, 0.0, registro.setor.clone()));
        entrada.0 += registro.paginas;
        entrada.1 += registro.custo;
    }

    let mut meses_ordenados: Vec<String> = por_mes.keys().cloned().collect();
    meses_ordenados.sort();
    let mes_atual = meses_ordenados.last().cloned().unwrap_or_default();
    let mes_anterior = if meses_ordenados.len() > 1 {
        meses_ordenados[meses_ordenados.len() - 2].clone()
    } else {
        String::new()
    };

    for registro in &registros {
        let par = variacao.entry(registro.impressora.clone()).or_insert((0.0, 0.0));
        if registro.mes == mes_atual { par.0 += registro.custo; }
        if registro.mes == mes_anterior { par.1 += registro.custo; }
    }

    let economia_percentual = {
        let atual = *por_mes.get(&mes_atual).unwrap_or(&0.0);
        let anterior = *por_mes.get(&mes_anterior).unwrap_or(&0.0);
        if anterior > 0.0 { (atual - anterior) / anterior * 100.0 } else { 0.0 }
    };

    let evolucao: Vec<Ponto> = meses_ordenados
        .iter()
        .map(|mes| Ponto { nome: mes.clone(), valor: *por_mes.get(mes).unwrap_or(&0.0) })
        .collect();

    let mut setores: Vec<Ponto> = por_setor
        .into_iter()
        .map(|(nome, valor)| Ponto { nome, valor })
        .collect();
    setores.sort_by(|a, b| b.valor.partial_cmp(&a.valor).unwrap_or(std::cmp::Ordering::Equal));

    let mut impressoras: Vec<LinhaCusto> = por_impressora
        .into_iter()
        .map(|(nome, (paginas, custo, setor))| {
            let (atual, anterior) = *variacao.get(&nome).unwrap_or(&(0.0, 0.0));
            let variacao_percentual = if anterior > 0.0 { (atual - anterior) / anterior * 100.0 } else { 0.0 };
            let participacao = if custo_total > 0.0 { (custo / custo_total * 100.0).round() as i64 } else { 0 };
            LinhaCusto { nome, setor, paginas, custo, variacao: variacao_percentual, participacao }
        })
        .collect();
    impressoras.sort_by(|a, b| b.custo.partial_cmp(&a.custo).unwrap_or(std::cmp::Ordering::Equal));

    Ok(Relatorio {
        custo_total,
        paginas,
        custo_por_pagina,
        economia_percentual,
        evolucao,
        setores,
        impressoras,
    })
}

/// Gera CSV em pt-br (separador `;`, BOM UTF-8) para exportação (RF-022).
pub fn exportar_csv(relatorio: &Relatorio) -> String {
    let escapar = |valor: &str| format!("\"{}\"", valor.replace('"', "\"\""));
    let mut csv = String::from("\u{FEFF}Impressora;Setor;Páginas;Custo (R$);Variação (%);Participação (%)\n");
    for linha in &relatorio.impressoras {
        csv.push_str(&format!(
            "{};{};{};{:.2};{:.1};{}\n",
            escapar(&linha.nome),
            escapar(&linha.setor),
            linha.paginas,
            linha.custo,
            linha.variacao,
            linha.participacao
        ));
    }
    csv.push_str(&format!(
        "\nTotal;;{};{:.2};;100\n",
        relatorio.paginas, relatorio.custo_total
    ));
    csv
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;

    #[test]
    fn gera_relatorio_e_csv() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        conexao.execute(
            "INSERT INTO impressoras (nome, status) VALUES ('HP Teste', 'pronta')",
            [],
        ).unwrap();
        conexao.execute(
            "INSERT INTO fila_impressao (documento, impressora_id, paginas, status, custo_estimado, criado_em)
             VALUES ('rel.pdf', 1, 100, 'concluido', 25.0, 'now')",
            [],
        ).unwrap();

        let relatorio = obter_relatorio(&conexao, 12, None).unwrap();
        assert_eq!(relatorio.paginas, 100);
        assert!((relatorio.custo_total - 25.0).abs() < 0.001);
        assert!((relatorio.custo_por_pagina - 0.25).abs() < 0.001);
        assert_eq!(relatorio.impressoras.len(), 1);

        let csv = exportar_csv(&relatorio);
        assert!(csv.contains("Impressora;Setor;Páginas"));
        assert!(csv.contains("HP Teste"));
    }
}
