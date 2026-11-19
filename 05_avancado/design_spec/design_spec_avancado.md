# Design Spec — Recursos Avançados (Print 360)

**Responsável:** Aquino Consultoria
**Versão:** 1.0 — para aprovação
**Complementar ao:** Design System v1.0 e `../design_system/design_system_avancado.md`
**Protótipos:** `../../02_design/svgs/avancado/`

---

## 1. Objetivo

Definir comportamento, hierarquia e estados das 5 novas telas dos recursos avançados, mantendo continuidade
visual com a v1.0 (sidebar 248 px, topbar 72 px, cards de 14 px de raio).

---

## 2. Estrutura global (inalterada)

| Região | Dimensão |
| --- | --- |
| Sidebar | 248 px |
| Topbar | 72 px |
| Conteúdo | padding 32 px |
| Cards | raio 14 px, sombra suave |

**Novos itens de navegação** (grupo "Recursos Avançados" na sidebar, abaixo de Configurações):
- Manutenção Preditiva
- Roteamento Inteligente
- Sincronização

Badge com ícone "sparkles"/"beta" em cada item nova.

---

## 3. Telas

### 3.1 `08_manutencao_preditiva.svg` — Manutenção Preditiva
**Objetivo:** priorizar intervenções antes da falha.

**Composição:**
- Cabeçalho + seletor de horizonte (7 / 30 / 90 dias);
- 4 KPIs: Saúde média da frota, Impressoras em atenção, Falhas previstas (30 d), Ordens abertas;
- **Gauge de saúde** da frota com classificação e confiança;
- **Gráfico de risco** (barras por impressora, com linha de limiar);
- **Lista de recomendações** ordenada por risco × custo, cada uma com: impressora, componente,
  dias previstos, confiança, fatores e botão "Criar ordem";
- **Linha do tempo** compacta das próximas manutenções.

**Estados:** sem dados suficientes (mensagem explicativa), baixa confiança (badge âmbar),
ordem já criada (badge "OS criada").

---

### 3.2 `09_saude_do_dispositivo.svg` — Saúde do Dispositivo
**Objetivo:** detalhar o que compõe a saúde de uma impressora.

**Composição:**
- Cabeçalho com nomeModelo + status;
- **Health score grande** (0–100) com semântica e delta vs. semana anterior;
- **Fatores contribuintes**: erros recentes, volume, desgaste, suprimentos, idade — cada um com
  barra de contribuição e valor;
- **Previsões por componente** com dias, probabilidade e confiança;
- **Linha do tempo de manutenção** (histórico + programado);
- Ações: "Criar ordem de serviço", "Ver histórico".

**Estados:** confiança baixa destaca aviso "Colete mais dados para aumentar a precisão".

---

### 3.3 `10_roteamento_inteligente.svg` — Roteamento Inteligente
**Objetivo:** configurar e validar regras de destino sem risco.

**Composição:**
- Cabeçalho com toggle global "Roteamento automático" (desligado por padrão);
- **KPIs**: trabalhos roteados hoje, economia estimada, regras ativas, fallback usado;
- **Editor de regra** em painel lateral: nome, prioridade, condições (setor, tipo, cor, urgência),
  ação (impressora/grupo, critério de escolha), fallback;
- **Lista de regras** ordenável com prioridade, condição resumida, destino e status;
- **Painel de simulação (dry-run)**: documento de exemplo → destino escolhido → justificativa
  (regra aplicada + fatores) → botão "Aplicar regra" (habilitado apenas após simular).

**Interações:** arrastar para reordenar; simular sempre antes de salvar; confirmação para ativar.

---

### 3.4 `11_sincronizacao_instalacoes.svg` — Sincronização entre Instalações
**Objetivo:** acompanhar topologia, fluxo e conflitos.

**Composição:**
- Cabeçalho com toggle global + botão "Sincronizar agora";
- **KPIs**: instalações ativas, pendências no outbox, conflitos, último ciclo;
- **Topologia**: nó central (esta instalação) conectado a 4 filiais, com linhas coloridas por estado
  (verde sincronizado, âmbar pendente, vermelho conflito, cinza offline), latência e volume;
- **Fila de mudanças** (outbox) com entidade, operação, versão e destino;
- **Histórico de ciclos** com duração, itens e status;
- **Conflitos pendentes** com botão "Revisar".

**Estados:** offline (nó cinza), sincronizando (spinner), conflito (destaque vermelho).

---

### 3.5 `12_configuracoes_avancadas.svg` — Configurações Avançadas
**Objetivo:** habilitar e calibrar os três módulos.

**Composição:**
- Sub-menu lateral: Predição, Roteamento, Sincronização, Feature Flags;
- **Feature flags** com 3 toggles grandes e descrição de impacto;
- **Predição**: horizonte (7/30/90), confiança mínima (slider), pesos dos sinais;
- **Roteamento**: critério padrão, tentativas de fallback, modo simulação obrigatória (toggle fixo);
- **Sincronização**: transporte (arquivo/LAN/nuvem), intervalo, entidades sincronizadas (checkboxes),
  política de conflito (manual/recente/origem);
- Rodapé: "Salvar alterações" e aviso de que mudanças são locais e auditadas.

---

## 4. Padrões de interação

| Padrão | Comportamento |
| --- | --- |
| Simulação obrigatória | Regra só pode ser ativada após um dry-run bem-sucedido |
| Confiança visível | Toda previsão mostra barra + rótulo (baixa/média/alta) |
| Explicação expandível | "Por quê?" revela os fatores sem sair da linha |
| Estados de sync | Cor + ícone + texto sempre juntos |
| Reordenação | Arrastar regra altera prioridade; confirmação ao soltar |
| Feature flags | Mudança de flag exige confirmação e registra auditoria |

---

## 5. Acessibilidade

- Gauge de saúde possui `role="img"` com `aria-label` descritivo e valor textual;
- Confiança Never by color alone: sempre acompanhada de texto;
- Regras reordenáveis também têm botões "Subir/Descer" para teclado;
- Simulação e conflitos usam `aria-live` para anunciar resultados;
- Contraste WCAG AA mantido nos novos tokens (ver Design System Recursos Avançados).

---

*Aquino Consultoria — tecnologia com propósito.*
