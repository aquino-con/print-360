# Requisitos Não Funcionais — Recursos Avançados (Print 360)

**Responsável:** Aquino Consultoria
**Versão:** 1.0 — para aprovação
**Prefixo:** RNF2-

---

## 1. Desempenho

| ID | Requisito | Meta |
| --- | --- | --- |
| RNF2-001 | Cálculo do health score para 100 impressoras | < 1 s |
| RNF2-002 | Simulação de roteamento com 200 trabalhos | < 500 ms |
| RNF2-003 | Ciclo de sincronização incremental (1000 mudanças) | < 10 s |
| RNF2-004 | Impacto do coletor preditivo no consumo de CPU | < 5% médio |
| RNF2-005 | Carregamento da tela de manutenção preditiva | < 1,5 s |

## 2. Segurança e Privacidade

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF2-006 | Transporte criptografado | TLS 1.2+ em qualquer sincronização em rede |
| RNF2-007 | Nunca sincronizar conteúdo de documentos | Apenas metadados e regras; filtro explícito no outbox |
| RNF2-008 | Autenticação entre instalações | Token por instalação, renovável e revogável |
| RNF2-009 | Auditoria de decisões automáticas | Toda previsão e roteamento registrado com timestamp |
| RNF2-010 | Opt-in por módulo | Nenhuma função dos recursos avançados ativa sem habilitação explícita |

## 3. Confiabilidade

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF2-011 | Operação offline integral | Predição e roteamento locais funcionam sem rede |
| RNF2-012 | Idempotência de sincronização | Reaplicar o mesmo lote não duplica registros |
| RNF2-013 | Recuperação de conflito | Nenhuma perda silenciosa; conflito sempre visível ou resolvido por política explícita |
| RNF2-014 | Falha de transporte não corrói o outbox | Transação separada; retry com backoff |

## 4. Explicabilidade e UX

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF2-015 | Toda previsão mostra fatores e confiança | Obrigatório na UI e na API |
| RNF2-016 | Toda decisão de roteamento é justificável | Regra + fatores + destino alternativo |
| RNF2-017 | Simulação antes de ativar regra | Botão "Simular" obrigatório no editor de regras |
| RNF2-018 | Estados de sincronização inequívocos | Cor + ícone + texto (nunca apenas cor) |

## 5. Compatibilidade e Evolução

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF2-019 | Schema versionado | Migrations 0004+ com compatibilidade retroativa |
| RNF2-020 | Modelo plugável | Heurística padrão substituível por adaptador de ML sem mudar UI |
| RNF2-021 | Feature flags persistidas | Preferências sobrevivem a atualizações |
| RNF2-022 | Compatibilidade com v1.0 | Instalações v1.0 continuam operando mesmo sem Recursos Avançados |

## 6. Critérios de Aceite Globais

- Nenhuma janela de console visível (mantendo a correção `CREATE_NO_WINDOW` do M4).
- 100% dos new commands com validação de entrada e erros serializados (`AppError`).
- Cobertura mínima de 70% nos módulos `predicao`, `roteamento` e `sincronizacao`.
- Lighthouse: acessibilidade ≥ 1.00 nas 5 novas telas.

---

*Aquino Consultoria — tecnologia com propósito.*
