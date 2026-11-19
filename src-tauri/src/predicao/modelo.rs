use serde::Serialize;

use crate::erro::AppResult;

use super::sinais::Sinais;

/// Um fator explicável que compôs uma avaliação.
#[derive(Debug, Clone, Serialize)]
pub struct Sinal {
    pub nome: String,
    pub valor: f64,
    pub peso: f64,
    pub contribuicao: f64,
    pub descricao: String,
}

/// Resultado do cálculo de saúde de um dispositivo.
#[derive(Debug, Clone, Serialize)]
pub struct AvaliacaoSaude {
    pub pontuacao: i64,
    pub classificacao: String,
    pub confianca: f64,
    pub fatores: Vec<Sinal>,
}

/// Previsão de falha de um componente.
#[derive(Debug, Clone, Serialize)]
pub struct PrevisaoComponente {
    pub componente: String,
    pub dias_previstos: i64,
    pub probabilidade: f64,
    pub confianca: String,
    pub fatores: Vec<String>,
}

/// Contrato do modelo preditivo (ADR F2-002).
pub trait ModeloPreditivo: Send + Sync {
    fn calcular_saude(&self, sinais: &Sinais) -> AppResult<AvaliacaoSaude>;
    fn prever(&self, sinais: &Sinais) -> AppResult<Vec<PrevisaoComponente>>;
}

/// Modelo heurístico padrão: transparente, offline e sem dependências externas.
pub struct ModeloHeuristico;

fn classificar(pontuacao: i64) -> &'static str {
    match pontuacao {
        85..=100 => "excelente",
        70..=84 => "bom",
        50..=69 => "atencao",
        _ => "critico",
    }
}

fn confianca(sinais: &Sinais) -> f64 {
    (0.5 + 0.1 * sinais.fontes_disponiveis as f64).min(0.95)
}

impl ModeloPreditivo for ModeloHeuristico {
    fn calcular_saude(&self, sinais: &Sinais) -> AppResult<AvaliacaoSaude> {
        let mut fatores = Vec::new();
        let mut perda = 0.0f64;

        macro_rules! fator {
            ($nome:expr, $valor:expr, $max:expr, $descricao:expr) => {{
                let valor = $valor as f64;
                let contribuicao = valor.clamp(0.0, 1.0) * $max as f64;
                perda += contribuicao;
                fatores.push(Sinal {
                    nome: $nome.to_string(),
                    valor,
                    peso: $max as f64 / 100.0,
                    contribuicao: contribuicao.round() as f64,
                    descricao: $descricao.to_string(),
                });
            }};
        }

        fator!("Erros recentes", sinais.erros_7d as f64 / 8.0, 30, "erros nos últimos 7 dias");
        fator!("Desgaste do tambor", sinais.desgaste_tambor as f64 / 100.0, 20, "desgaste estimado do tambor");
        fator!("Erros no mês", sinais.erros_30d as f64 / 20.0, 15, "erros nos últimos 30 dias");
        fator!("Suprimentos", (100 - sinais.nivel_suprimento_min) as f64 / 100.0, 12, "menor nível de suprimento");
        fator!("Volume", sinais.volume_30d as f64 / 50_000.0, 10, "páginas impressas no mês");
        fator!("Idade", sinais.idade_anos as f64 / 10.0, 8, "idade estimada do equipamento");
        fator!("Manutenção", sinais.dias_desde_manutencao as f64 / 90.0, 5, "dias desde a última manutenção");

        let pontuacao = (100.0 - perda).round().clamp(0.0, 100.0) as i64;
        Ok(AvaliacaoSaude {
            pontuacao,
            classificacao: classificar(pontuacao).to_string(),
            confianca: confianca(sinais),
            fatores,
        })
    }

    fn prever(&self, sinais: &Sinais) -> AppResult<Vec<PrevisaoComponente>> {
        let conf = confianca(sinais);
        let conf_txt = || -> String {
            if conf >= 0.8 { "alta".into() } else if conf >= 0.65 { "media".into() } else { "baixa".into() }
        };

        let desgaste = sinais.desgaste_tambor as f64;
        let dias_tambor = ((100.0 - desgaste) / 100.0 * 120.0).round().max(3.0) as i64;
        let prob_tambor = (desgaste / 100.0 * 0.9 + 0.05).min(0.95);

        let volume = sinais.volume_30d as f64;
        let dias_fusor = (180.0 - volume / 1000.0 - sinais.idade_anos as f64 * 5.0)
            .round().max(15.0) as i64;
        let prob_fusor = (0.25 + volume / 200_000.0).min(0.8);

        let dias_bandeja = (120.0 - sinais.erros_7d as f64 * 12.0
            - sinais.alertas_nao_resolvidos as f64 * 10.0)
            .round().max(20.0) as i64;
        let prob_bandeja = (0.2 + sinais.erros_7d as f64 * 0.08).min(0.7);

        let papel = sinais.nivel_papel as f64;
        let dias_papel = (papel / 100.0 * 30.0).round().max(0.0) as i64;
        let prob_papel = (100.0 - papel) / 100.0;

        Ok(vec![
            PrevisaoComponente {
                componente: "Tambor".into(),
                dias_previstos: dias_tambor,
                probabilidade: prob_tambor,
                confianca: conf_txt(),
                fatores: vec![format!("desgaste {}%", sinais.desgaste_tambor), format!("volume {} pág.", sinais.volume_30d)],
            },
            PrevisaoComponente {
                componente: "Fusor".into(),
                dias_previstos: dias_fusor,
                probabilidade: prob_fusor,
                confianca: "media".into(),
                fatores: vec![format!("volume {} pág.", sinais.volume_30d), format!("idade {} anos", sinais.idade_anos)],
            },
            PrevisaoComponente {
                componente: "Bandeja 1".into(),
                dias_previstos: dias_bandeja,
                probabilidade: prob_bandeja,
                confianca: if sinais.fontes_disponiveis >= 4 { "media".into() } else { "baixa".into() },
                fatores: vec![format!("{} erros em 7 dias", sinais.erros_7d), format!("{} alertas", sinais.alertas_nao_resolvidos)],
            },
            PrevisaoComponente {
                componente: "Papel".into(),
                dias_previstos: dias_papel,
                probabilidade: prob_papel,
                confianca: if sinais.fontes_disponiveis >= 3 { "alta".into() } else { "baixa".into() },
                fatores: vec![format!("nível {}%", sinais.nivel_papel)],
            },
        ])
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn saude_e_classificacao() {
        let modelo = ModeloHeuristico;
        let bons = Sinais {
            fontes_disponiveis: 5,
            nivel_suprimento_min: 100,
            nivel_papel: 100,
            ..Default::default()
        };
        let avaliacao = modelo.calcular_saude(&bons).unwrap();
        assert_eq!(avaliacao.pontuacao, 100);
        assert_eq!(avaliacao.classificacao, "excelente");
        assert!(avaliacao.confianca > 0.9);

        let ruins = Sinais {
            erros_7d: 8, desgaste_tambor: 100, erros_30d: 20,
            nivel_suprimento_min: 0, volume_30d: 50_000, idade_anos: 10,
            dias_desde_manutencao: 90, fontes_disponiveis: 5, ..Default::default()
        };
        let avaliacao = modelo.calcular_saude(&ruins).unwrap();
        assert_eq!(avaliacao.pontuacao, 0);
        assert_eq!(avaliacao.classificacao, "critico");
        assert_eq!(avaliacao.fatores.len(), 7);
    }

    #[test]
    fn previsoes_tem_quatro_componentes() {
        let modelo = ModeloHeuristico;
        let sinais = Sinais {
            desgaste_tambor: 82, volume_30d: 42_000, idade_anos: 5,
            nivel_papel: 18, erros_7d: 2, fontes_disponiveis: 5, ..Default::default()
        };
        let previsoes = modelo.prever(&sinais).unwrap();
        assert_eq!(previsoes.len(), 4);
        assert_eq!(previsoes[0].componente, "Tambor");
        assert!(previsoes[0].dias_previstos < previsoes[1].dias_previstos);
    }
}
