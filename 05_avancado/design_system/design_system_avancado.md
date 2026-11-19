# Design System — Extensões dos recursos avançados (Print 360)

**Responsável:** Aquino Consultoria
**Versão:** 1.0 — para aprovação
**Base:** Design System v1.0 (`01_planejamento/design_system/design_system.md`)

---

## 1. Princípio

A Recursos Avançados **estende** o Design System existente. Nenhum token v1.0 é removido. Novos tokens
cobrem saúde, confiança, sincronização e decisões automáticas.

---

## 2. Novos tokens de cor

| Token | Hex | Uso |
| --- | --- | --- |
| `--cor-saude-excelente` | `#10B981` | Health score ≥ 85 |
| `--cor-saude-bom` | `#2563EB` | Health score 70–84 |
| `--cor-saude-atencao` | `#F59E0B` | Health score 50–69 |
| `--cor-saude-critico` | `#DC2626` | Health score < 50 |
| `--cor-confianca-alta-fundo` | `#D1FAE5` | Badge de confiança alta |
| `--cor-confianca-media-fundo` | `#FEF3C7` | Badge de confiança média |
| `--cor-confianca-baixa-fundo` | `#F1F5F9` | Badge de confiança baixa |
| `--cor-sync-ok` | `#10B981` | Nó sincronizado |
| `--cor-sync-pendente` | `#F59E0B` | Nó com pendência |
| `--cor-sync-conflito` | `#DC2626` | Nó em conflito |
| `--cor-sync-offline` | `#94A3B8` | Nó offline |
| `--cor-beta` | `#7C3AED` | Destaque "Recursos Avançados / beta" |

> Textos sobre fundos claros usam as variantes escuras já definidas no v1.0
> (`--cor-sucesso-texto`, `--cor-aviso-texto`, `--cor-perigo-texto`) para manter WCAG AA.

---

## 3. Novos componentes

### 3.1 `HealthGauge`
- Círculo de 120 px com arco preenchido conforme pontuação;
- Número central (0–100) e rótulo classificatório abaixo;
- `role="img"` + `aria-label` com valor e classificação.

### 3.2 `PredictionCard`
- Componente, dias previstos, probabilidade e badge de confiança;
- Botão "Por quê?" expande a lista de fatores;
- Ação opcional "Criar ordem".

### 3.3 `ConfidenceBar`
- Barra de 6 px com 3 segmentos e rótulo textual;
- Nunca apenas cor (RNF2-018).

### 3.4 `RuleRow`
- Prioridade (número), ícone de arraste, condição resumida, destino, toggle;
- Botões alternativos "Subir/Descer" para acessibilidade por teclado.

### 3.5 `SyncNode`
- Cartão de nó com nome, site, estado (ícone + cor + texto), latência e volume;
- Linha de conexão tracejada quando pendente, sólida quando íntegro.

### 3.6 `JustificationPanel`
- Painel de simulação com seta de entrada → destino;
- Lista de fatores em `aria-live="polite"`.

### 3.7 `FeatureFlagCard`
- Toggle grande, título, descrição de impacto e badge "beta";
- Confirmação modal ao alterar (RF2-023).

---

## 4. Padrões visuais novos

| Padrão | Regra |
| --- | --- |
| Badge "Recursos Avançados" | Roxo `--cor-beta`, fundo `#EDE9FE`, texto `#5B21B6`, 10 px |
| Confiança | Sempre barra + texto; nunca só cor |
| Simulação | Fundo azul muito claro `#EFF6FF`, borda tracejada `#93C5FD` |
| Conflito | Borda esquerda 4 px vermelha + ícone de alerta + texto "Conflito" |
| Linha do tempo | Pontos de 10 px, linha vertical 2 px, datas em 10 px secundário |
| Regra desativada | Opacidade 60% + badge "Inativa" |

---

## 5. Motion (respeitando `prefers-reduced-motion`)

- Gauge anima o arco em 400 ms (`ease-out`);
- Nó de sincronização usa pulso suave de 1,6 s apenas no estado "sincronizando";
- Mudanças em `aria-live` não usam animação.

---

## 6. Ícones adicionais (Lucide)

`Activity`, `BrainCircuit`, `CalendarClock`, `GitBranch`, `Network`, `RefreshCw`,
`Route`, `ShieldCheck`, `Sparkles`, `Timer`, `Wrench`, `ZoomIn`.

---

## 7. Do / Don't

**Faça**
- Mostre sempre o fator que gerou a previsão;
- Use o mesmo vocabulário das telas v1.0 ("Pronta", "Erro", "Suprimento");
- Simule antes de ativar qualquer regra.

**Evite**
- Apresentar previsão sem confiança;
- Usar apenas cor para estado de sincronização;
- Ocultar a justificativa do roteamento automático.

---

*Aquino Consultoria — tecnologia com propósito.*
