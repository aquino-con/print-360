mod comandos;
mod erro;
mod estado;
mod integracao;
mod modelos;
mod predicao;
mod repositorio;
mod roteamento;
mod sincronizacao;
mod servicos;
mod util;

use std::sync::Arc;

/// Ponto de entrada da aplicação Tauri 2.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let estado = Arc::new(estado::AppState::novo().expect("falha ao inicializar o banco de dados"));
    let estado_coletor = estado.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(estado)
        .setup(move |app| {
            // Uma única sincronização antes de exibir a janela evita disponibilizar
            // listas vazias e dispensa consultar o spooler a cada renderização de tela.
            if let Err(erro) = integracao::coletor::sincronizar(&estado_coletor) {
                log::warn!("Falha na sincronização inicial: {}", erro);
            }
            integracao::coletor::iniciar(app.handle().clone(), estado_coletor.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            comandos::comandos_impressoras::listar_impressoras,
            comandos::comandos_impressoras::adicionar_impressora,
            comandos::comandos_impressoras::pausar_impressora,
            comandos::comandos_impressoras::retomar_impressora,
            comandos::comandos_impressoras::limpar_fila_impressora,
            comandos::comandos_fila::listar_trabalhos,
            comandos::comandos_fila::pausar_trabalho,
            comandos::comandos_fila::retomar_trabalho,
            comandos::comandos_fila::cancelar_trabalho,
            comandos::comandos_fila::reiniciar_trabalho,
            comandos::comandos_relatorios::obter_resumo_dashboard,
            comandos::comandos_relatorios::obter_atividade_recente,
            comandos::comandos_relatorios::obter_relatorio,
            comandos::comandos_relatorios::exportar_relatorio_csv,
            comandos::comandos_suprimentos::listar_suprimentos,
            comandos::comandos_suprimentos::registrar_troca_suprimento,
            comandos::comandos_usuarios::listar_usuarios,
            comandos::comandos_usuarios::listar_setores,
            comandos::comandos_usuarios::adicionar_usuario,
            comandos::comandos_usuarios::salvar_cota,
            comandos::comandos_alertas::listar_alertas,
            comandos::comandos_alertas::resolver_alerta,
            comandos::comandos_config::obter_configuracoes,
            comandos::comandos_config::salvar_configuracoes,
            comandos::comandos_config::salvar_parametros_custo,
            comandos::comandos_predicao::obter_saude_frota,
            comandos::comandos_predicao::obter_previsoes,
            comandos::comandos_predicao::listar_ordens_servico,
            comandos::comandos_predicao::criar_ordem_servico,
            comandos::comandos_predicao::recalcular_predicoes,
            comandos::comandos_roteamento::listar_regras,
            comandos::comandos_roteamento::salvar_regra,
            comandos::comandos_roteamento::alternar_regra,
            comandos::comandos_roteamento::excluir_regra,
            comandos::comandos_roteamento::simular_roteamento,
            comandos::comandos_roteamento::listar_decisoes_roteamento,
            comandos::comandos_sincronizacao::obter_status_sync,
            comandos::comandos_sincronizacao::listar_outbox,
            comandos::comandos_sincronizacao::sincronizar_agora,
            comandos::comandos_sincronizacao::cadastrar_instalacao,
            comandos::comandos_sincronizacao::resolver_conflito_sync,
            comandos::comandos_backup::exportar_backup,
            comandos::comandos_backup::importar_backup,
            comandos::comandos_backup::listar_auditoria,
        ])
        .run(tauri::generate_context!())
        .expect("erro ao executar o Print 360");
}
