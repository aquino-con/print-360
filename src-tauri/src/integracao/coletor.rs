//! Coletor em segundo plano (RF-033): sincroniza spooler → SQLite e emite eventos Tauri.

use std::{collections::HashSet, sync::Arc, time::Duration};

use rusqlite::{params, Connection};
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;

use crate::{
    erro::{AppError, AppResult},
    estado::AppState,
    servicos::{
        servico_alertas, servico_custos, servico_descoberta, servico_suprimentos, servico_usuarios,
    },
};

pub const INTERVALO_SEGUNDOS: u64 = 15;
pub const EVENTO_FILA: &str = "fila_atualizada";
pub const EVENTO_IMPRESSORAS: &str = "impressoras_atualizadas";
pub const EVENTO_ALERTAS: &str = "alertas_atualizados";

/// Inicia a tarefa de coleta. Chamada uma única vez no `setup` do Tauri.
pub fn iniciar(app: AppHandle, estado: Arc<AppState>) {
    tauri::async_runtime::spawn(async move {
        let mut intervalo = tokio::time::interval(Duration::from_secs(INTERVALO_SEGUNDOS));
        let mut notificados: HashSet<i64> = HashSet::new();

        loop {
            intervalo.tick().await;
            match sincronizar(&estado) {
                Ok(alterou) if alterou => {
                    let _ = app.emit(EVENTO_FILA, ());
                    let _ = app.emit(EVENTO_IMPRESSORAS, ());
                    let _ = app.emit(EVENTO_ALERTAS, ());
                }
                Ok(_) => {}
                Err(erro) => log::warn!("Falha na coleta do spooler: {}", erro),
            }

            // Notificações nativas para alertas críticos ainda não avisados (RF-025).
            if let Ok(conexao) = estado.db.lock() {
                if let Ok(criticos) = servico_alertas::listar_criticos_pendentes(&conexao) {
                    for (id, titulo) in criticos {
                        if notificados.insert(id) {
                            let _ = app
                                .notification()
                                .builder()
                                .title("Print 360 — Alerta crítico")
                                .body(titulo)
                                .show();
                        }
                    }
                }
            }

            // Sincronização incremental entre instalações (opcional, nunca bloqueia a coleta).
            if let Ok(conexao) = estado.db.lock() {
                let ativo: String = conexao
                    .query_row(
                        "SELECT valor FROM configuracoes WHERE chave = 'f2_sync_ativa'",
                        [],
                        |linha| linha.get(0),
                    )
                    .unwrap_or_else(|_| "false".to_string());
                if ativo == "true" {
                    drop(conexao);
                    if let Ok(mut conexao) = estado.db.lock() {
                        match crate::sincronizacao::servico::sincronizar(&mut conexao, &*estado.transporte) {
                            Ok(resultado) => {
                                let _ = app.emit(
                                    crate::comandos::comandos_sincronizacao::EVENTO_SYNC_CONCLUIDA,
                                    &resultado,
                                );
                            }
                            Err(erro) => log::warn!("Falha na sincronização automática: {}", erro),
                        }
                    }
                }
            }
        }
    });
}

/// Sincroniza impressoras e trabalhos do spooler com o banco local.
/// Retorna `true` quando houve alguma alteração relevante.
pub fn sincronizar(estado: &AppState) -> AppResult<bool> {
    let mut conexao = estado
        .db
        .lock()
        .map_err(|_| AppError::Validacao("banco de dados indisponível".into()))?;

    let automatica: String = conexao
        .query_row(
            "SELECT valor FROM configuracoes WHERE chave = 'descoberta_automatica'",
            [],
            |linha| linha.get(0),
        )
        .unwrap_or_else(|_| "true".to_string());

    let impressoras = if automatica == "true" {
        servico_descoberta::coletar(&conexao, &*estado.spooler).unwrap_or_else(|erro| {
            log::warn!("Descoberta automática falhou: {}", erro);
            Vec::new()
        })
    } else {
        Vec::new()
    };
    let trabalhos = estado.spooler.listar_trabalhos(None)?;

    let transacao = conexao.transaction()?;
    let descoberta = servico_descoberta::aplicar(&transacao, &impressoras)?;
    let alterou_impressoras = descoberta.novas > 0 || descoberta.atualizadas > 0;
    let alterou_trabalhos = sincronizar_trabalhos(&transacao, &trabalhos)?;
    let alterou_alertas = sincronizar_alertas(&transacao, &impressoras)?;
    transacao.commit()?;

    // Estes serviços abrem suas próprias transações; por isso rodam após o commit.
    servico_custos::recalcular_pendentes(&mut conexao)?;
    let alterou_suprimentos = servico_suprimentos::verificar_niveis(&conexao)? > 0;
    let alterou_cotas = servico_usuarios::verificar_cotas(&conexao)? > 0;

    // Predição é opcional (feature flag) e nunca bloqueia a coleta principal.
    let alterou_predicao = {
        let ativo: String = conexao
            .query_row(
                "SELECT valor FROM configuracoes WHERE chave = 'f2_predicao_ativa'",
                [],
                |linha| linha.get(0),
            )
            .unwrap_or_else(|_| "false".to_string());
        if ativo == "true" {
            crate::predicao::servico::recalcular(&mut conexao, &*estado.modelo).unwrap_or(false)
        } else {
            false
        }
    };

    // Roteamento automático registra decisões para novos trabalhos quando ativo.
    let alterou_roteamento =
        crate::roteamento::servico::aplicar_a_novos_trabalhos(&conexao).unwrap_or(0) > 0;

    Ok(alterou_impressoras
        || alterou_trabalhos
        || alterou_alertas
        || alterou_suprimentos
        || alterou_cotas
        || alterou_predicao
        || alterou_roteamento)
}

fn sincronizar_trabalhos(
    conexao: &Connection,
    trabalhos: &[super::spooler::TrabalhoSistema],
) -> AppResult<bool> {
    let mut alterou = false;
    let mut ids_atuais = Vec::with_capacity(trabalhos.len());

    for trabalho in trabalhos {
        ids_atuais.push(trabalho.id_sistema.clone());
        let mudou = conexao.execute(
            "INSERT INTO fila_impressao
                (documento, usuario_id, impressora_id, paginas, status, progresso,
                 tamanho_bytes, custo_estimado, id_sistema, criado_em)
             VALUES (?1, NULL, (SELECT id FROM impressoras WHERE nome = ?2), ?3, ?4, ?5, ?6, 0, ?7, CURRENT_TIMESTAMP)
             ON CONFLICT(id_sistema) DO UPDATE SET
                 status = excluded.status,
                 progresso = excluded.progresso,
                 paginas = excluded.paginas,
                 documento = excluded.documento,
                 tamanho_bytes = excluded.tamanho_bytes
             WHERE fila_impressao.status <> excluded.status
                OR fila_impressao.progresso <> excluded.progresso",
            params![
                trabalho.documento,
                trabalho.impressora,
                trabalho.paginas,
                trabalho.status,
                trabalho.progresso,
                trabalho.tamanho_bytes,
                trabalho.id_sistema
            ],
        )?;
        alterou |= mudou > 0;
    }

    // Trabalhos que desapareceram do spooler são concluídos, não excluídos (RF-010).
    let mut declaracao = conexao.prepare(
        "SELECT id, id_sistema FROM fila_impressao
         WHERE id_sistema IS NOT NULL
           AND status IN ('pendente', 'processando', 'pausado')",
    )?;
    let pendentes: Vec<(i64, String)> = declaracao
        .query_map([], |linha| Ok((linha.get(0)?, linha.get(1)?)))?
        .collect::<Result<_, _>>()?;
    drop(declaracao);

    for (id, id_sistema) in pendentes {
        if !ids_atuais.contains(&id_sistema) {
            conexao.execute(
                "UPDATE fila_impressao
                 SET status = 'concluido', progresso = 100, concluido_em = CURRENT_TIMESTAMP
                 WHERE id = ?1",
                params![id],
            )?;
            alterou = true;
        }
    }

    Ok(alterou)
}

fn sincronizar_alertas(
    conexao: &Connection,
    impressoras: &[super::spooler::ImpressoraSistema],
) -> AppResult<bool> {
    let mut alterou = false;
    for impressora in impressoras.iter().filter(|item| item.status == "erro") {
        let existente: i64 = conexao.query_row(
            "SELECT COUNT(*) FROM alertas
             WHERE tipo = 'erro_impressora' AND resolvido = 0 AND titulo LIKE ?1",
            params![format!("%{}%", impressora.nome)],
            |linha| linha.get(0),
        )?;
        if existente == 0 {
            conexao.execute(
                "INSERT INTO alertas (tipo, severidade, titulo, mensagem, impressora_id)
                 SELECT 'erro_impressora', 'critico', ?1, ?2, id FROM impressoras WHERE nome = ?3",
                params![
                    format!("Erro na impressora {}", impressora.nome),
                    "O spooler reportou estado de erro. Verifique a fila e os suprimentos.",
                    impressora.nome
                ],
            )?;
            alterou = true;
        }
    }
    Ok(alterou)
}

#[cfg(test)]
mod testes {
    use std::sync::Mutex;

    use rusqlite::Connection;

    use super::*;
    use crate::{
        integracao::spooler::{ImpressoraSistema, Spooler, TrabalhoSistema},
        repositorio::migrations::aplicar_migrations,
    };

    struct SpoolerFalso;

    impl Spooler for SpoolerFalso {
        fn listar_impressoras(&self) -> AppResult<Vec<ImpressoraSistema>> {
            Ok(vec![
                ImpressoraSistema {
                    nome: "HP Teste".into(),
                    modelo: Some("Laser".into()),
                    endereco: None,
                    status: "pronta".into(),
                    compartilhada: false,
                },
                ImpressoraSistema {
                    nome: "Epson Erro".into(),
                    modelo: None,
                    endereco: None,
                    status: "erro".into(),
                    compartilhada: false,
                },
            ])
        }

        fn listar_trabalhos(&self, _: Option<&str>) -> AppResult<Vec<TrabalhoSistema>> {
            Ok(vec![TrabalhoSistema {
                id_sistema: "HP Teste:7".into(),
                documento: "relatorio.pdf".into(),
                impressora: "HP Teste".into(),
                usuario: Some("ana".into()),
                paginas: 5,
                status: "processando".into(),
                progresso: 40,
                tamanho_bytes: Some(2048),
            }])
        }

        fn pausar_trabalho(&self, _: &str, _: &str) -> AppResult<()> { Ok(()) }
        fn retomar_trabalho(&self, _: &str, _: &str) -> AppResult<()> { Ok(()) }
        fn cancelar_trabalho(&self, _: &str, _: &str) -> AppResult<()> { Ok(()) }
        fn reiniciar_trabalho(&self, _: &str, _: &str) -> AppResult<()> { Ok(()) }
        fn limpar_fila(&self, _: &str) -> AppResult<()> { Ok(()) }
        fn pausar_impressora(&self, _: &str) -> AppResult<()> { Ok(()) }
        fn retomar_impressora(&self, _: &str) -> AppResult<()> { Ok(()) }
    }

    fn estado_falso() -> AppState {
        let conexao = Connection::open_in_memory().unwrap();
        aplicar_migrations(&conexao).unwrap();
        AppState {
            db: Arc::new(Mutex::new(conexao)),
            spooler: Arc::new(SpoolerFalso),
            caminho_db: std::path::PathBuf::from(":memory:"),
            modelo: Arc::new(crate::predicao::modelo::ModeloHeuristico),
            transporte: Arc::new(crate::sincronizacao::transporte::TransporteArquivo::novo(
                std::path::Path::new(":memory:"),
            )),
        }
    }

    #[test]
    fn sincroniza_impressoras_trabalhos_e_alertas() {
        let estado = estado_falso();
        assert!(sincronizar(&estado).unwrap());

        let conexao = estado.db.lock().unwrap();
        let impressoras: i64 = conexao
            .query_row("SELECT COUNT(*) FROM impressoras", [], |linha| linha.get(0))
            .unwrap();
        assert_eq!(impressoras, 2);

        let trabalhos: i64 = conexao
            .query_row("SELECT COUNT(*) FROM fila_impressao", [], |linha| linha.get(0))
            .unwrap();
        assert_eq!(trabalhos, 1);

        let alertas: i64 = conexao
            .query_row("SELECT COUNT(*) FROM alertas WHERE resolvido = 0", [], |linha| linha.get(0))
            .unwrap();
        assert_eq!(alertas, 1);
    }

    #[test]
    fn sincronizacao_e_idempotente() {
        let estado = estado_falso();
        assert!(sincronizar(&estado).unwrap());
        assert!(!sincronizar(&estado).unwrap());
    }
}
