# Design Spec — Print 360

**Responsável:** Aquino Consultoria
**Status:** Planejamento
**Versão:** 1.0
**Complementar ao:** Design System (`../design_system/design_system.md`)

---

## 1. Objetivo

Esta especificação define **como cada tela se comporta e se organiza**, traduzindo os requisitos funcionais em decisões concretas de layout, hierarquia, interação e estados. Os protótipos vetoriais de alta fidelidade estão em `../../02_design/svgs/`.

---

## 2. Princípios de Design

1. **Hierarquia clara** — o dado mais importante aparece primeiro e com maior peso visual.
2. **Densidade equilibrada** — informações técnicas sem poluição; uso generoso de espaçamento.
3. **Estado é informação** — status sempre explícito por cor + texto + ícone (nunca só cor).
4. **Ação靠近 ao contexto** — botões de ação junto ao objeto que afetam.
5. **Previsibilidade** — padrões repetidos em todas as telas (tabela, card, filtro).

---

## 3. Estrutura Global da Interface

### 3.1 Grade e dimensões (viewport de referência: 1440 × 900)

| Região | Dimensão | Descrição |
| --- | --- | --- |
| Sidebar | 248 px (largura) | Navegação principal, fixa à esquerda |
| Topbar | 72 px (altura) | Busca global, notificações, perfil |
| Área de conteúdo | 1192 × 828 px | Padding de 32 px ao redor |
| Cards | raio 12 px, sombra suave | Unidade base de agrupamento |

### 3.2 Sidebar
- Logo "Print 360" + assinatura "Aquino Consultoria" no topo;
- Itens de navegação com ícone + rótulo: Visão Geral, Fila de Impressão, Impressoras, Suprimentos, Relatórios, Usuários e Cotas, Configurações;
- Item ativo com fundo em destaque e barra indicadora à esquerda;
- Badge numérico em "Fila de Impressão" e "Suprimentos" quando há pendências;
- Rodapé com versão do app e status de conexão.

### 3.3 Topbar
- Breadcrumb / título da seção à esquerda;
- Campo de busca global ao centro;
- Ícones de notificação (com badge) e ajuda, avatar do usuário à direita.

---

## 4. Telas

### 4.1 Visão Geral (Dashboard) — `01_visao_geral.svg`
**Objetivo:** panorama imediato da operação.

**Composição:**
- Saudação e período ("Visão geral · Hoje, 19 de novembro");
- **4 KPIs** em cards: Páginas impressas (hoje), Custo estimado (mês), Impressoras ativas, Alertas pendentes;
- **Gráfico de barras** de volume de impressão nos últimos 7 dias;
- **Lista de status das impressoras** (top 5) com indicador e nível de suprimento;
- **Feed de atividade recente** (últimos trabalhos e eventos).

**Estados:** carregamento (skeletons), vazio (nenhuma impressora), erro de coleta.

---

### 4.2 Fila de Impressão — `02_fila_de_impressao.svg`
**Objetivo:** controlar trabalhos pendentes e em andamento.

**Composição:**
- KPIs compactos: Na fila, Em processamento, Pausados, Concluídos hoje;
- Barra de filtros: busca, status (dropdown), impressora (dropdown), período;
- **Tabela de trabalhos**: Documento, Usuário, Impressora, Páginas, Progresso, Status, Ações;
- Progress bar por linha para trabalhos em processamento;
- Botões de ação: Pausar, Retomar, Cancelar, Reiniciar;
- Ações em lote via checkbox.

**Interações:** clique na linha abre detalhe do trabalho; confirmação para cancelar.

---

### 4.3 Impressoras — `03_impressoras.svg`
**Objetivo:** inventário e saúde da frota.

**Composição:**
- KPIs: Total de impressoras, Ativas, Com erro, Em manutenção;
- Filtros por status e setor;
- **Grade de cards de impressoras**: modelo, status, endereço, setor, mini-indicadores de suprimento, botão "Ver detalhes";
- Painel lateral de detalhes ao selecionar uma impressora (modelo, serial, firmware, suprimentos, ações).

---

### 4.4 Suprimentos — `04_suprimentos.svg`
**Objetivo:** antecipar falhas por falta de insumos.

**Composição:**
- KPIs: Itens monitorados, Nível baixo, Esgotados, Trocas este mês;
- **Lista agrupada por impressora** com barras de nível (toner CMYK, tambor, papel, grampo);
- Código de cores: verde (>50%), âmbar (20–50%), vermelho (<20%);
- Destaque de alertas no topo;
- Ação "Registrar troca".

---

### 4.5 Relatórios — `05_relatorios.svg`
**Objetivo:** apoiar decisões de custo e rateio.

**Composição:**
- Filtros de período e setor;
- KPIs: Custo total, Páginas, Custo por página, Economia vs. mês anterior;
- **Gráfico de linha** de evolução de custo (12 meses);
- **Gráfico de rosca** de rateio por setor;
- **Tabela** de custo por impressora com variação mensal;
- Botão "Exportar" (CSV/PDF).

---

### 4.6 Usuários e Cotas — `06_usuarios_e_cotas.svg`
**Objetivo:** governar consumo por pessoa/setor.

**Composição:**
- KPIs: Usuários ativos, Cotas ativas, Acima da cota, Consumo médio;
- **Tabela de usuários**: nome, setor, perfil, consumo, cota, uso (barra), status, ações;
- Barra de uso com cor por faixa (verde/âmbar/vermelho);
- Botão "Novo usuário" e "Editar cota".

---

### 4.7 Configurações — `07_configuracoes.svg`
**Objetivo:** parametrizar o sistema.

**Composição:**
- Menu lateral secundário: Geral, Custos, Alertas, Impressoras, Usuários e Permissões, Backup;
- **Formulários** com agrupamento por seção;
- Toggles para opções, campos numéricos para custos e limites;
- Botão "Salvar alterações" fixo no rodapé do painel;
- Feedback de sucesso/erro.

---

## 5. Padrões de Interação

| Padrão | Comportamento |
| --- | --- |
| Filtros | Aplicam instantaneamente; botão "Limpar" restaura padrão |
| Tabelas | Ordenação por coluna, paginação, seleção múltipla |
| Ações destrutivas | Confirmação modal antes de executar |
| Carregamento | Skeleton durante fetch; spinner só em ações pontuais |
| Vazio | Ilustração + mensagem + ação principal (ex.: "Cadastrar impressora") |
| Erro | Mensagem clara + botão "Tentar novamente" |
| Toast | Confirmação de ações no canto inferior direito |

---

## 6. Acessibilidade

- Contraste WCAG AA; foco visível em todos os controles;
- Navegação por teclado (Tab/Shift+Tab, Enter, Esc);
- Ícones com rótulo textual ou `aria-label`;
- Status nunca representado apenas por cor — sempre acompanhado de texto/ícone;
- Tamanhos mínimos de alvo de clique: 32 px.

---

## 7. Responsividade

Embora seja desktop, a interface deve degradar bem:
- ≥ 1280 px: layout completo;
- 1024–1279 px: sidebar colapsa para ícones;
- < 1024 px: aviso de resolução mínima recomendada.

---

## 8. Motion (recursos avançados)

- Transições suaves de 150–200 ms (fade/slide) em troca de telas e abertura de painéis;
- Respeitar preferência de "reduzir movimento" do sistema.

---

*Aquino Consultoria — tecnologia com propósito.*
