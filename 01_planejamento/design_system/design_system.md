# Design System — Print 360

**Responsável:** Aquino Consultoria
**Status:** Planejamento
**Versão:** 1.0
**Aplicado nos protótipos:** `../../02_design/svgs/`

---

## 1. Fundamentos

O Design System do Print 360 é construído sobre uma base **profissional, densa e confiável**, adequada a ferramentas de gestão. A identidade combina um azul de confiança (tecnologia) com um ciano de energia (impressão), sobre neutros frios (slate).

---

## 2. Tokens de Cor

### 2.1 Cores da marca
| Token | Hex | Uso |
| --- | --- | --- |
| `--cor-primaria` | `#2563EB` | Ações principais, links, item ativo |
| `--cor-primaria-hover` | `#1D4ED8` | Hover do primário |
| `--cor-secundaria` | `#06B6D4` | Acentos, gráficos, destaques |
| `--cor-secundaria-hover` | `#0891B2` | Hover do secundário |

### 2.2 Cores semânticas
| Token | Hex | Uso |
| --- | --- | --- |
| `--cor-sucesso` | `#10B981` | Status pronto, concluído, nível bom |
| `--cor-sucesso-fundo` | `#D1FAE5` | Fundo de badge de sucesso |
| `--cor-aviso` | `#F59E0B` | Nível médio, atenção |
| `--cor-aviso-fundo` | `#FEF3C7` | Fundo de badge de aviso |
| `--cor-perigo` | `#EF4444` | Erro, esgotado, cancelar |
| `--cor-perigo-fundo` | `#FEE2E2` | Fundo de badge de erro |
| `--cor-info` | `#3B82F6` | Informação neutra |
| `--cor-info-fundo` | `#DBEAFE` | Fundo de badge informativo |
| `--cor-info-texto` | `#1D4ED8` | Texto informativo sobre fundo claro (WCAG AA) |

> Os textos semânticos foram escurecidos no M4 para atingir WCAG AA: sucesso `#047857`,
> aviso `#B45309`, perigo `#B91C1C`. As cores de preenchimento permanecem as originais.

### 2.3 Neutros (escala slate)
| Token | Hex | Uso |
| --- | --- | --- |
| `--cor-fundo` | `#F1F5F9` | Fundo da aplicação |
| `--cor-superficie` | `#FFFFFF` | Cards, topbar, painéis |
| `--cor-sidebar` | `#0F172A` | Fundo da navegação |
| `--cor-sidebar-hover` | `#1E293B` | Hover na navegação |
| `--cor-texto` | `#0F172A` | Texto principal |
| `--cor-texto-secundario` | `#475569` | Textos auxiliares (WCAG AA em superfícies claras) |
| `--cor-texto-claro` | `#64748B` | Captions em superfícies claras |
| `--cor-texto-escuro` | `#94A3B8` | Texto sobre fundo escuro (sidebar) — contraste ≥ 4.5:1 |
| `--cor-borda` | `#E2E8F0` | Bordas e divisores |

---

## 3. Tipografia

- **Família:** Inter, fallback `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Escala:**

| Token | Tamanho | Peso | Uso |
| --- | --- | --- | --- |
| `--fonte-3xl` | 30 px | 700 | Títulos de página / KPIs |
| `--fonte-2xl` | 24 px | 700 | Títulos de seção |
| `--fonte-xl` | 18 px | 600 | Subtítulos |
| `--fonte-lg` | 15 px | 600 | Rótulos de destaque |
| `--fonte-md` | 14 px | 400 | Corpo / tabelas |
| `--fonte-sm` | 12 px | 400 | Auxiliares, captions |
| `--fonte-xs` | 11 px | 600 | Badges, etiquetas |

---

## 4. Espaçamento

Escala baseada em 4 px: `4, 8, 12, 16, 20, 24, 32, 40, 48`.
- Padding interno de cards: **20–24 px**;
- Gap entre cards: **20 px**;
- Margem da área de conteúdo: **32 px**.

---

## 5. Formas e Elevação

- **Raio de borda:** `--raio-sm: 6px`, `--raio-md: 10px`, `--raio-lg: 14px`, `--raio-pilula: 999px`;
- **Sombra cards:** `0 1px 3px rgba(15,23,42,.08), 0 1px 2px rgba(15,23,42,.04)`;
- **Sombra elevada (popover/modal):** `0 10px 25px rgba(15,23,42,.15)`;
- **Borda padrão:** `1px solid var(--cor-borda)`.

---

## 6. Ícones

- Estilo: **lineares, 1.5–2 px de traço**, 20 px (nav) e 16 px (ações);
- Conjunto recomendado: Lucide Icons;
- Ícones sempre acompanhados de rótulo textual na navegação.

Ícones usados: grade (dashboard), lista (fila), impressora, pacote (suprimentos), gráfico (relatórios), usuários, engrenagem (config), sino (alertas), busca, mais, filtro, download, pausa, play, x, refresh.

---

## 7. Componentes

### 7.1 Botões
| Variante | Estilo | Uso |
| --- | --- | --- |
| Primário | Fundo primário, texto branco | Ação principal ("Salvar", "Novo usuário") |
| Secundário | Fundo branco, borda | Ações alternativas ("Exportar") |
| Fantasma | Sem fundo, texto primário | Ações sutis ("Ver detalhes") |
| Perigo | Fundo vermelho / texto vermelho | "Cancelar", "Excluir" |
| Ícone | Quadrado 32 px com ícone | Ações em tabelas |

Estados: hover, active, focus (anel 2px primário), disabled (opacidade 50%).

### 7.2 Cards
- Fundo branco, borda, raio 14 px, sombra suave;
- Título em 15 px semibold, conteúdo abaixo;
- Card de KPI: rótulo (12 px, secundário) + valor (30 px, bold) + variação/ícone.

### 7.3 Badges de status
- Formato pílula, fundo semântico claro, texto escuro da mesma família;
- Ex.: "Pronta" (verde), "Erro" (vermelho), "Pausado" (âmbar), "Em manutenção" (neutro).

### 7.4 Tabelas
- Cabeçalho com fundo `#F8FAFC`, texto 11 px uppercase, borda inferior;
- Linhas com altura 48–56 px, hover `#F8FAFC`, divisor `#F1F5F9`;
- Coluna de ações alinhada à direita;
- Ordenação indicada por seta.

### 7.5 Barras de progresso / nível
- Altura 8 px, raio pilula, fundo `#E2E8F0`;
- Preenchimento por cor semântica conforme faixa;
- Texto percentual à direita quando relevante.

### 7.6 Campos de formulário
- Label acima (12 px, secundário), input altura 40 px, borda `#CBD5E1`, raio 8 px;
- Focus: borda primária + anel suave;
- Toggle: 40 × 22 px, "on" primário.

### 7.7 Navegação
- Sidebar escuro (`#0F172A`), itens com ícone + texto;
- Ativo: fundo `#1E293B`, texto branco e barra primária à esquerda;
- Topbar branca com busca, sino (badge) e avatar.

### 7.8 Toast / notificação
- Canto inferior direito, fundo branco, borda esquerda semântica, ícone + mensagem, 4 s.

---

## 8. Regras de Uso (Do / Don't)

**Faça:**
- Use sempre os tokens (nunca hex avulso);
- Acompanhe status por cor **+ texto + ícone**;
- Mantenha alinhamento à grade de 4 px;
- Prefira ícones Lucide com rótulo.

**Evite:**
- Cores saturadas em excesso ou gradientes chamativos;
- Texto abaixo de 11 px;
- Botões primários competindo na mesma tela (no máximo um principal);
- Ícones sem rótulo em ações críticas.

---

## 9. Aplicação nos Protótipos

Todos os SVGs em `../../02_design/svgs/` empregam estes tokens de forma consistente:
- Sidebar `#0F172A`, topbar `#FFFFFF`, fundo `#F1F5F9`;
- Primário `#2563EB`, acento `#06B6D4`;
- Semânticas `#10B981 / #F59E0B / #EF4444`;
- Tipografia Inter, raios e sombras definidos acima.

---

*Aquino Consultoria — tecnologia com propósito.*
