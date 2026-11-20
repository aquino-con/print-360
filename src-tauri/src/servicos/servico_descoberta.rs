use std::time::Instant;

use rusqlite::{params, Connection};

use crate::{
    erro::AppResult,
    integracao::spooler::{ImpressoraSistema, Spooler},
    modelos::ResultadoDescoberta,
};

/// Persiste a lista de impressoras reportada pelo spooler (RF-001).
///
/// Usada tanto pela descoberta manual quanto pela coleta automática, garantindo
/// que as duas operações tenham exatamente o mesmo comportamento.
pub fn aplicar(
    conexao: &Connection,
    descobertas: &[ImpressoraSistema],
) -> AppResult<ResultadoDescoberta> {
    let inicio = Instant::now();
    let mut novas = 0usize;
    let mut atualizadas = 0usize;

    for impressora in descobertas {
        let existente: Option<i64> = conexao
            .query_row(
                "SELECT id FROM impressoras WHERE nome = ?1",
                params![impressora.nome],
                |linha| linha.get(0),
            )
            .ok();

        let mudou = conexao.execute(
            "INSERT INTO impressoras (nome, modelo, endereco, status, origem, ultima_vista)
             VALUES (?1, ?2, ?3, ?4, 'spooler', CURRENT_TIMESTAMP)
             ON CONFLICT(nome) DO UPDATE SET
                 modelo = excluded.modelo,
                 endereco = excluded.endereco,
                 status = excluded.status,
                 origem = 'spooler',
                 ultima_vista = CURRENT_TIMESTAMP
             WHERE impressoras.status <> excluded.status
                OR impressoras.modelo IS NOT excluded.modelo
                OR impressoras.endereco IS NOT excluded.endereco",
            params![
                impressora.nome,
                impressora.modelo,
                impressora.endereco,
                impressora.status
            ],
        )?;

        if existente.is_some() {
            if mudou > 0 {
                atualizadas += 1;
            }
        } else {
            novas += 1;
        }

        // Suprimentos básicos para dispositivos recém-descobertos (RF-011).
        for tipo in ["toner_preto", "papel"] {
            conexao.execute(
                "INSERT OR IGNORE INTO suprimentos (impressora_id, tipo, nivel)
                 SELECT id, ?2, 100 FROM impressoras WHERE nome = ?1",
                params![impressora.nome, tipo],
            )?;
        }
    }

    Ok(ResultadoDescoberta {
        encontradas: descobertas.len(),
        novas,
        atualizadas,
        tempo_ms: inicio.elapsed().as_millis() as i64,
    })
}

fn configuracao(conexao: &Connection, chave: &str, padrao: &str) -> String {
    conexao
        .query_row("SELECT valor FROM configuracoes WHERE chave = ?1", params![chave], |linha| linha.get(0))
        .unwrap_or_else(|_| padrao.to_string())
}

/// Coleta impressoras do spooler local e, se habilitado, da rede configurada.
pub fn coletar(conexao: &Connection, spooler: &dyn Spooler) -> AppResult<Vec<ImpressoraSistema>> {
    let mut lista = spooler.listar_impressoras()?;

    if configuracao(conexao, "descoberta_rede_ativa", "false") == "true" {
        let alvos = configuracao(conexao, "descoberta_rede_alvos", "");
        match crate::integracao::rede::descobrir(&alvos) {
            Ok(encontradas) => {
                for impressora in encontradas {
                    let duplicata = lista.iter().any(|item| {
                        match (&item.endereco, &impressora.endereco) {
                            (Some(a), Some(b)) => a == b,
                            _ => item.nome == impressora.nome,
                        }
                    });
                    if !duplicata {
                        lista.push(impressora);
                    }
                }
            }
            Err(erro) => log::warn!("Descoberta em rede falhou: {}", erro),
        }
    }
    Ok(lista)
}

/// Consulta spooler e rede e persiste o resultado (acionado pelo botão "Descobrir").
pub fn descobrir(
    conexao: &Connection,
    spooler: &dyn Spooler,
) -> AppResult<ResultadoDescoberta> {
    let descobertas = coletar(conexao, spooler)?;
    let resultado = aplicar(conexao, &descobertas)?;
    conexao.execute(
        "INSERT INTO configuracoes (chave, valor) VALUES ('ultima_descoberta', datetime('now'))
         ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
        [],
    )?;
    Ok(resultado)
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::repositorio::migrations::aplicar_migrations;

    fn item(nome: &str, status: &str) -> ImpressoraSistema {
        ImpressoraSistema {
            nome: nome.to_string(),
            modelo: Some("Modelo".to_string()),
            endereco: None,
            status: status.to_string(),
            compartilhada: false,
        }
    }

    #[test]
    fn conta_novas_e_atualizadas() {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();

        let primeiro = aplicar(&conexao, &[item("Impressora 01", "pronta"), item("Impressora 02", "pronta")]).unwrap();
        assert_eq!(primeiro.encontradas, 2);
        assert_eq!(primeiro.novas, 2);
        assert_eq!(primeiro.atualizadas, 0);

        let segundo = aplicar(&conexao, &[item("Impressora 01", "erro")]).unwrap();
        assert_eq!(segundo.novas, 0);
        assert_eq!(segundo.atualizadas, 1);

        let terceiro = aplicar(&conexao, &[item("Impressora 01", "erro")]).unwrap();
        assert_eq!(terceiro.atualizadas, 0);

        let origem: String = conexao
            .query_row("SELECT origem FROM impressoras WHERE nome = 'Impressora 01'", [], |l| l.get(0))
            .unwrap();
        assert_eq!(origem, "spooler");
    }
}
