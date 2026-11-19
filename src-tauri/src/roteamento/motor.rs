use crate::erro::{AppError, AppResult};

use super::regra::{Candidato, Condicao, Contexto, Decisao, Regra};

fn valor_contexto(contexto: &Contexto, campo: &str) -> String {
    match campo {
        "setor" => contexto.setor.clone().unwrap_or_default(),
        "documento" => contexto.documento.clone(),
        "paginas" => contexto.paginas.to_string(),
        "cor" => contexto.cor.clone(),
        "urgencia" => contexto.urgencia.clone(),
        "tamanho_bytes" => contexto
            .tamanho_bytes
            .map(|valor| valor.to_string())
            .unwrap_or_default(),
        _ => String::new(),
    }
}

/// Avalia uma condição contra o contexto do trabalho.
pub fn avaliar_condicao(condicao: &Condicao, contexto: &Contexto) -> bool {
    let atual = valor_contexto(contexto, &condicao.campo).to_lowercase();
    let esperado = condicao.valor.trim().to_lowercase();
    let numerico = |texto: &str| texto.parse::<f64>().unwrap_or(f64::NAN);

    match condicao.operador.as_str() {
        "igual" => atual == esperado,
        "diferente" => atual != esperado,
        "contem" => atual.contains(&esperado),
        "maior_que" => numerico(&atual) > numerico(&esperado),
        "menor_que" => numerico(&atual) < numerico(&esperado),
        _ => false,
    }
}

fn regra_corresponde(regra: &Regra, contexto: &Contexto) -> bool {
    regra
        .condicoes
        .iter()
        .all(|condicao| avaliar_condicao(condicao, contexto))
}

fn ordenar_por_criterio(
    candidatos: &mut Vec<&Candidato>,
    criterio: &str,
    contexto: &Contexto,
) {
    match criterio {
        "menor_custo" => candidatos.sort_by(|a, b| {
            a.custo_pagina
                .partial_cmp(&b.custo_pagina)
                .unwrap_or(std::cmp::Ordering::Equal)
        }),
        "menor_carga" => candidatos.sort_by_key(|candidato| candidato.carga),
        "proximidade" => candidatos.sort_by(|a, b| {
            let setor = contexto.setor.as_deref().unwrap_or("");
            let a_proximo = a.setor.as_deref().unwrap_or("").eq_ignore_ascii_case(setor);
            let b_proximo = b.setor.as_deref().unwrap_or("").eq_ignore_ascii_case(setor);
            b_proximo
                .cmp(&a_proximo)
                .then_with(|| a.carga.cmp(&b.carga))
        }),
        _ => candidatos.sort_by(|a, b| {
            let a_pronta = a.status == "pronta";
            let b_pronta = b.status == "pronta";
            b_pronta
                .cmp(&a_pronta)
                .then_with(|| a.carga.cmp(&b.carga))
        }),
    }
}

/// Seleciona o destino aplicando a primeira regra correspondente (RF2-009).
pub fn selecionar(
    regras: &[Regra],
    candidatos: &[Candidato],
    contexto: &Contexto,
) -> AppResult<Decisao> {
    if candidatos.is_empty() {
        return Err(AppError::NaoEncontrado("nenhuma impressora cadastrada".into()));
    }

    let mut regras_ordenadas: Vec<&Regra> = regras.iter().filter(|regra| regra.ativa).collect();
    regras_ordenadas.sort_by_key(|regra| regra.prioridade);

    let regra = regras_ordenadas
        .iter()
        .copied()
        .find(|regra| regra_corresponde(regra, contexto));

    let mut justificativa = Vec::new();
    let (regra_id, regra_nome, criterio, pool_nomes): (
        Option<i64>,
        Option<String>,
        String,
        Vec<String>,
    ) = match regra {
        Some(regra) => {
            justificativa.push(format!("Regra aplicada: {}", regra.nome));
            let nomes = if let Some(impressora) = &regra.acao.impressora {
                vec![impressora.clone()]
            } else if !regra.acao.grupo.is_empty() {
                regra.acao.grupo.clone()
            } else {
                candidatos.iter().map(|candidato| candidato.nome.clone()).collect()
            };
            (
                Some(regra.id),
                Some(regra.nome.clone()),
                regra.acao.criterio.clone(),
                nomes,
            )
        }
        None => {
            justificativa.push("Nenhuma regra correspondente: impressora padrão".into());
            (
                None,
                None,
                "disponibilidade".to_string(),
                candidatos.iter().map(|candidato| candidato.nome.clone()).collect(),
            )
        }
    };

    let mut pool: Vec<&Candidato> = candidatos
        .iter()
        .filter(|candidato| pool_nomes.iter().any(|nome| nome == &candidato.nome) && candidato.disponivel())
        .collect();
    let candidatos_avaliados = pool.len();

    if pool.is_empty() {
        return Err(AppError::Integracao(
            "nenhuma impressora disponível no destino da regra".into(),
        ));
    }

    ordenar_por_criterio(&mut pool, &criterio, contexto);
    let mut escolhido = pool[0];
    let mut fallback_usado = false;
    justificativa.push(format!("Critério de escolha: {}", criterio));
    justificativa.push(format!(
        "Destino {} com status {} e {} trabalho(s) na fila",
        escolhido.nome, escolhido.status, escolhido.carga
    ));

    if let Some(regra) = regra {
        if !escolhido.disponivel() && regra.acao.fallback.is_some() {
            if let Some(fallback) = candidatos
                .iter()
                .find(|candidato| Some(&candidato.nome) == regra.acao.fallback.as_ref() && candidato.disponivel())
            {
                escolhido = fallback;
                fallback_usado = true;
                justificativa.push(format!("Fallback aplicado: {}", escolhido.nome));
            }
        }
    }

    Ok(Decisao {
        regra_id,
        regra_nome,
        impressora: escolhido.nome.clone(),
        criterio,
        justificativa,
        fallback_usado,
        candidatos_avaliados,
    })
}

#[cfg(test)]
mod testes {
    use super::*;
    use super::super::regra::Acao;

    fn candidatos() -> Vec<Candidato> {
        vec![
            Candidato {
                nome: "HP M404".into(), setor: Some("Tecnologia".into()), status: "pronta".into(),
                carga: 1, custo_pagina: 0.25, nivel_suprimento: 80,
            },
            Candidato {
                nome: "Xerox C405".into(), setor: Some("Financeiro".into()), status: "pronta".into(),
                carga: 4, custo_pagina: 0.85, nivel_suprimento: 60,
            },
            Candidato {
                nome: "Brother Erro".into(), setor: Some("RH".into()), status: "erro".into(),
                carga: 0, custo_pagina: 0.20, nivel_suprimento: 5,
            },
        ]
    }

    fn regra(id: i64, prioridade: i64, campo: &str, valor: &str, destino: &str) -> Regra {
        Regra {
            id,
            nome: format!("Regra {}", id),
            prioridade,
            condicoes: vec![Condicao {
                campo: campo.into(), operador: "igual".into(), valor: valor.into(),
            }],
            acao: Acao {
                impressora: Some(destino.into()),
                grupo: vec![],
                criterio: "disponibilidade".into(),
                fallback: None,
            },
            ativa: true,
            criada_em: "2026-11-19T10:00:00".into(),
        }
    }

    #[test]
    fn avalia_condicoes_dos_tipos_suportados() {
        let contexto = Contexto {
            documento: "relatorio.pdf".into(), setor: Some("Financeiro".into()),
            paginas: 120, cor: "cor".into(), urgencia: "alta".into(), tamanho_bytes: Some(2048),
        };
        assert!(avaliar_condicao(&Condicao { campo: "setor".into(), operador: "igual".into(), valor: "financeiro".into() }, &contexto));
        assert!(!avaliar_condicao(&Condicao { campo: "setor".into(), operador: "diferente".into(), valor: "financeiro".into() }, &contexto));
        assert!(avaliar_condicao(&Condicao { campo: "documento".into(), operador: "contem".into(), valor: "relatorio".into() }, &contexto));
        assert!(avaliar_condicao(&Condicao { campo: "paginas".into(), operador: "maior_que".into(), valor: "50".into() }, &contexto));
        assert!(avaliar_condicao(&Condicao { campo: "paginas".into(), operador: "menor_que".into(), valor: "200".into() }, &contexto));
    }

    #[test]
    fn primeira_regra_por_prioridade_vence() {
        let regras = vec![
            regra(1, 1, "setor", "financeiro", "Xerox C405"),
            regra(2, 2, "setor", "financeiro", "HP M404"),
        ];
        let contexto = Contexto { setor: Some("Financeiro".into()), ..Default::default() };
        let decisao = selecionar(&regras, &candidatos(), &contexto).unwrap();
        assert_eq!(decisao.regra_id, Some(1));
        assert_eq!(decisao.impressora, "Xerox C405");
        assert!(!decisao.justificativa.is_empty());
    }

    #[test]
    fn ignora_regra_inativa_e_impressora_indisponivel() {
        let mut regra_inativa = regra(1, 1, "setor", "rh", "Brother Erro");
        regra_inativa.ativa = false;
        let regras = vec![regra_inativa];
        let contexto = Contexto { setor: Some("RH".into()), ..Default::default() };
        let decisao = selecionar(&regras, &candidatos(), &contexto).unwrap();
        assert_eq!(decisao.regra_id, None);
        assert_ne!(decisao.impressora, "Brother Erro");
    }

    #[test]
    fn criterio_menor_custo_escolhe_o_mais_barato_disponivel() {
        let mut regra_custo = regra(1, 1, "cor", "pb", "HP M404");
        regra_custo.acao.impressora = None;
        regra_custo.acao.grupo = vec!["HP M404".into(), "Xerox C405".into(), "Brother Erro".into()];
        regra_custo.acao.criterio = "menor_custo".into();
        let contexto = Contexto { cor: "pb".into(), ..Default::default() };
        let decisao = selecionar(&[regra_custo], &candidatos(), &contexto).unwrap();
        assert_eq!(decisao.impressora, "HP M404");
    }
}
