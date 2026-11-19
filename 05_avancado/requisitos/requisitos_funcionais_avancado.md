# Requisitos Funcionais — Recursos Avançados (Print 360)

**Responsável:** Aquino Consultoria
**Versão:** 1.0 — para aprovação
**Prefixo:** RF2-

---

## 1. Manutenção Preditiva

### RF2-001 — Índice de saúde do dispositivo
Calcular um *health score* (0–100) por impressora, combinando: erros recentes, nível de
suprimentos, idade do equipamento, volume acumulado e tempo desde a última manutenção.

**Critérios:** atualizado a cada coleta; sempre acompanhado dos fatores que o compõem.

### RF2-002 — Previsão de falha
Estimar, em dias, a probabilidade de falha de cada componente (tambor, fusor, bandeja, papel).

**Critérios:** horizonte padrão de 7/30 dias; exibir confiança (baixa/média/alta) e fatores.

### RF2-003 — Recomendações de manutenção
Gerar recomendações priorizadas por risco × custo, com ação sugerida e prazo.

### RF2-004 — Ordem de serviço
Criar, atribuir e concluir ordens de serviço a partir de uma recomendação, com responsável,
data prevista, custo estimado e status.

### RF2-005 — Linha do tempo de manutenção
Visualizar histórico + intervenções programadas em uma linha do tempo por impressora.

### RF2-006 — Explicabilidade
Para toda previsão, exibir os sinais utilizados (ex.: "3 erros em 7 dias", "tambor com 82% de desgaste").

---

## 2. Roteamento Inteligente

### RF2-007 — Regras de roteamento
Criar regras com condições (setor, tipo de documento, tamanho, cor, horário, urgência) e ações
(impressora destino, grupo de impressoras, critério de escolha).

### RF2-008 — Critérios de escolha
Selecionar destino por: disponibilidade, proximidade (site/setor), custo por página, carga atual
e nível de suprimento.

### RF2-009 — Precedência e prioridade
Ordenar regras por prioridade; a primeira regra correspondente vence; permitir regras de exclusão.

### RF2-010 — Simulação (dry-run)
Aplicar a regra a trabalhos de exemplo e mostrar o destino escolhido **sem enviar para impressão**.

### RF2-011 — Justificativa por trabalho
Registrar por que cada trabalho foi roteado para determinada impressora (regra aplicada e fatores).

### RF2-012 — Fallback
Definir impressora substituta quando a destino estiver indisponível, com número máximo de tentativas.

### RF2-013 — Roteamento manual com override
Permitir que o usuário escolha manualmente outra impressora, registrando o motivo e sobrescrevendo a regra.

---

## 3. Sincronização entre Instalações

### RF2-014 — Cadastro de instalações
Registrar instalações (filiais) com identificador, nome, site e status (ativo/inativo).

### RF2-015 — Topologia e status
Visualizar nós e conexões, com último sync, latência, volume trocado e estado (sincronizado,
pendente, conflito, offline).

### RF2-016 — Fila de mudanças (outbox)
Registrar localmente cada alteração relevante em uma fila com versão, origem e timestamp.

### RF2-017 — Sincronização incremental
Enviar apenas mudanças desde o último cursor conhecido.

### RF2-018 — Resolução de conflitos
Detectar alterações concorrentes no mesmo registro e aplicar política configurável:
*vence a mais recente*, *vence a origem priority*, ou *manual*.

### RF2-019 — Revisão de conflitos
Tela para revisar conflitos pendentes, comparar versões e escolher a versão vencedora.

### RF2-020 — Histórico de sincronização
Registrar cada ciclo: horário, nós envolvidos, itens enviados/recebidos, erros e duração.

### RF2-021 — Modo offline
Continuar operando normalmente sem conexão e sincronizar quando a conexão retornar.

### RF2-022 — Seletividade por dados
Escolher quais entidades são sincronizadas (ex.: apenas cotas e regras; nunca documentos).

---

## 4. Configurações dos recursos avançados

### RF2-023 — Feature flags
Ativar/desativar isoladamente: predição, roteamento automático e sincronização.

### RF2-024 — Parâmetros preditivos
Configurar horizontes, limiares de confiança e peso dos sinais.

### RF2-025 — Parâmetros de sincronização
Definir intervalo, transporte (arquivo / rede local / nuvem opcional), entidades e política de conflito.

---

## 5. Matriz de Rastreabilidade (resumo)

| Épico | Requisitos | Telas SVG |
| --- | --- | --- |
| Manutenção preditiva | RF2-001 a RF2-006 | 08, 09, 12 |
| Roteamento inteligente | RF2-007 a RF2-013 | 10, 12 |
| Sincronização | RF2-014 a RF2-022 | 11, 12 |
| Configurações | RF2-023 a RF2-025 | 12 |

---

*Aquino Consultoria — tecnologia com propósito.*
