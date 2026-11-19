# Roadmap — Recursos Avançados (Print 360)

**Responsável:** Aquino Consultoria
**Status:** Aprovado ✅ · **M1 ✅ · M2 ✅ · M3 ✅ · M4 ✅** · v2.0.0 entregue
**Versão:** 1.0

---

## 1. Visão dos marcos

| Marco | Escopo | Duração estimada |
| --- | --- | --- |
| M1 | Fundação preditiva + telas 08 e 09 — ✅ CONCLUÍDO | 3–4 semanas |
| M2 | Motor de roteamento + tela 10 — ✅ CONCLUÍDO | 3–4 semanas |
| M3 | Sincronização + tela 11 — ✅ CONCLUÍDO | 4–5 semanas |
| M4 | Configurações, refino, testes e release — ✅ CONCLUÍDO | 2 semanas |

---

## 2. M1 — Manutenção Preditiva — ✅ CONCLUÍDO

- [x] Migration 0004 (saúde, previsões, ordens, parâmetros)
- [x] Trait `ModeloPreditivo` + `ModeloHeuristico` plugável
- [x] Coleta de sinais (`predicao/sinais.rs`) com contagem de fontes para confiança
- [x] Health score com 7 fatores explicáveis e classificação
- [x] Previsão por componente (tambor, fusor, bandeja, papel) com confiança
- [x] Persistência transacional e recálculo no coletor (respeitando a feature flag)
- [x] Comandos: `obter_saude_frota`, `obter_previsoes`, `listar_ordens_servico`,
  `criar_ordem_servico`, `recalcular_predicoes`
- [x] Telas 08 (Manutenção Preditiva) e 09 (Saúde do Dispositivo) + gauge acessível
- [x] Auditoria na criação de ordens de serviço

**Validação:** `cargo check` ✅ · `cargo test` ✅ 14/14 · `npm run build` ✅ · navegador ✅
(criação de OS, "Por quê?", navegação para saúde do dispositivo, zero erros de console).

**Critério de aceite:** previsão 7 dias com precisão ≥ 80% na base de teste; fatores exibidos em 100% dos casos.

---

## 3. M2 — Roteamento Inteligente — ✅ CONCLUÍDO

- [x] Migration 0005 (regras, execuções e parâmetros)
- [x] Motor first-match com prioridade e regras inativas ignoradas
- [x] 5 operadores de condição (igual, diferente, contem, maior_que, menor_que)
- [x] 4 critérios de escolha (disponibilidade, proximidade, menor_custo, menor_carga)
- [x] Simulador (dry-run) sem efeito colateral
- [x] Fallback configurável e justificativa por decisão
- [x] Comandos: listar/salvar/alternar/excluir regras, simular, listar decisões
- [x] Registro automático de decisões para novos trabalhos quando a flag estiver ativa
- [x] Tela 10 com editor de regras e simulação obrigatória antes de salvar
- [x] Testes: 5 novos testes (matriz de condições, prioridade, inativas, critério de custo, serviço)

**Validação:** `cargo test` ✅ 19/19 · `npm run build` ✅ · navegador ✅
(simulação, travamento do botão "Salvar e ativar" até simular, criação de regra e toggle, zero erros).

**Critério de aceite:** nenhuma regra ativada sem simulação prévia; 100% dos trabalhos com justificativa registrada.

---

## 4. M3 — Sincronização entre Instalações — ✅ CONCLUÍDO

- [x] Migration 0006 (instalações, versões, outbox, ciclos, conflitos)
- [x] Trait `Transporte` + `TransporteArquivo` (JSONL, offline) e `TransporteHttp` (TLS)
- [x] Cursor incremental e idempotência por versão por entidade
- [x] Políticas de conflito: manual, recente e origem + tela de revisão
- [x] Eventos `sync_iniciada`, `sync_concluida`, `conflito_detectado`
- [x] Outbox alimentado por alterações em regras de roteamento e cotas
- [x] Tela 11 (Sincronização) com topologia, outbox, histórico e conflitos
- [x] Testes: 3 novos testes (transporte idempotente, conflito, ciclo completo)

**Validação:** `cargo test` ✅ 22/22 · `npm run build` ✅ · navegador ✅
(sincronizar agora, resolver conflito, topologia e ciclos, zero erros de console).

**Critério de aceite:** 1000 mudanças sincronizadas em < 10 s; zero perdas silenciosas em conflito.

---

## 5. M4 — Configuração e Release — ✅ CONCLUÍDO

- [x] Chaves de configuração já presentes nas migrations 0004, 0005 e 0006 (nenhuma migration adicional necessária)
- [x] Tela 12 (Configurações Avançadas) com feature flags e parâmetros dos três módulos
- [x] Auditoria de alterações de configuração
- [x] Acessibilidade Lighthouse 1.00 em acessibilidade, boas práticas e SEO
- [x] Versão final 2.0.0 e instalador NSIS em português
- [x] Documentação de operação e upgrade v1.0 → v2.0

---

## 6. KPIs de sucesso dos recursos avançados

| KPI | Meta |
| --- | --- |
| Precisão da previsão de falha (7 dias) | ≥ 80% |
| Redução de paradas não planejadas | −40% |
| Economia de custo por roteamento | −12% |
| Trabalhos entregues na 1ª tentativa | ≥ 98% |
| Conflitos não resolvidos em 24 h | 0 |
| Cobertura de testes nos novos módulos | ≥ 70% |

---

## 7. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Falsos positivos em predição | Confiança mínima configurável + dois sinais concordantes |
| Rejeição do roteamento automático | Simulação obrigatória + override manual com motivo |
| Divergência entre instalações | Outbox versionado + revisão explícita de conflitos |
| Escopo extenso | Feature flags permitem release incremental por módulo |

---

## 8. Entregáveis desta etapa

- Documentos em `05_avancado/` (visão, requisitos, arquitetura, modelo de dados, design spec, design system, roadmap);
- 5 SVGs de alta fidelidade em `02_design/svgs/avancado/`.

---

*Aquino Consultoria — tecnologia com propósito.*
