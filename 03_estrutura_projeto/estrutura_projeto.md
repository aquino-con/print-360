# Estrutura de Pastas e Arquivos — Print 360

**Responsável:** Aquino Consultoria
**Status:** Planejamento
**Versão:** 1.0

---

## 1. Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
| --- | --- | --- |
| Pastas de planejamento | `NN_nome_em_pt_br` | `01_planejamento`, `design_system` |
| Arquivos de documento | `snake_case.pt-br.md` (ou `.md`) | `modelo_dados.md` |
| Módulos Rust | `snake_case.rs` | `servico_impressoras.rs` |
| Componentes React | `PascalCase.tsx` | `CardKPI.tsx` |
| Hooks / utils TS | `camelCase.ts` | `useImpressoras.ts` |
| Comandos Tauri | `snake_case` (exposto ao frontend) | `obter_resumo_dashboard` |
| Constantes de DB | `snake_case.sql` | `0001_inicial.sql` |

> Identificadores de código seguem o padrão da linguagem; **nomes de pastas e documentos são em pt-br**.

---

## 2. Árvore Completa do Projeto de Código

A árvore **atualizada após o M1** está em `arvore_projeto.txt` (fonte da verdade).
A árvore abaixo representa o plano completo; os módulos marcados como planejados
(`repo_*.rs`, `servico_*.rs` específicos, adaptadores de spooler por SO) serão criados no M2.

**Já implementados no M1:** `comandos/*`, `servico_relatorios.rs`, `repositorio/*`,
`modelos/mod.rs`, `util/*`, `migrations/0001_inicial.sql`, estilos, componentes de UI,
layout e as 7 páginas React.

**Adicionados no M2:** `migrations/0002_integracao_spooler.sql`, `integracao/util.rs`,
`integracao/spooler_windows.rs`, `integracao/spooler_cups.rs`, `integracao/coletor.rs`,
comandos de operações de fila/frota, hook `useEventos.ts` e ações com toast nas telas.

**Adicionados no M3:** `migrations/0003_suprimentos_custos.sql`, `servicos/servico_suprimentos.rs`,
`servico_custos.rs`, `servico_usuarios.rs`, `servico_alertas.rs`, comandos correspondentes,
`CentralDeAlertas.tsx`, tipos de relatório e modais de troca/cota/usuário.

**Adicionados no M4:** `comandos/comandos_backup.rs`, `servicos/servico_auditoria.rs`,
`caminho_db` no `AppState`, seção "Backup e Dados" com auditoria, `public/robots.txt` e
ajustes de acessibilidade/code-splitting em todo o frontend.

```
print_360/
│
├── 01_planejamento/                 # documentos (já criados)
│   ├── visao_produto/
│   ├── requisitos/
│   ├── arquitetura/
│   ├── design_spec/
│   └── design_system/
│
├── 02_design/                       # artefatos visuais (já criados)
│   ├── svgs/
│   └── referencias/
│
├── 03_estrutura_projeto/            # este documento
│
├── 04_documentacao/
│   └── roadmap.md
│
├── src-tauri/                       # BACKEND RUST (Tauri 2)
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/
│   │   ├── icon.ico
│   │   ├── icon.icns
│   │   └── icon.png
│   ├── migrations/
│   │   ├── 0001_inicial.sql
│   │   ├── 0002_metricas_diarias.sql
│   │   └── 0003_alertas.sql
│   └── src/
│       ├── main.rs                  # entrypoint: builder do Tauri
│       ├── lib.rs                   # configuração de plugins e estado
│       ├── erro.rs                  # enum AppError + conversões
│       ├── estado.rs                # AppState (db, spooler, config)
│       ├── comandos/                # camada IPC
│       │   ├── mod.rs
│       │   ├── comandos_impressoras.rs
│       │   ├── comandos_fila.rs
│       │   ├── comandos_suprimentos.rs
│       │   ├── comandos_usuarios.rs
│       │   ├── comandos_relatorios.rs
│       │   └── comandos_config.rs
│       ├── servicos/                # regras de negócio
│       │   ├── mod.rs
│       │   ├── servico_impressoras.rs
│       │   ├── servico_fila.rs
│       │   ├── servico_suprimentos.rs
│       │   ├── servico_custos.rs
│       │   ├── servico_cotas.rs
│       │   ├── servico_alertas.rs
│       │   └── servico_relatorios.rs
│       ├── repositorio/             # acesso ao SQLite
│       │   ├── mod.rs
│       │   ├── conexao.rs
│       │   ├── migrations.rs
│       │   ├── repo_impressoras.rs
│       │   ├── repo_fila.rs
│       │   ├── repo_suprimentos.rs
│       │   ├── repo_usuarios.rs
│       │   ├── repo_alertas.rs
│       │   └── repo_metricas.rs
│       ├── integracao/              # adaptadores do SO
│       │   ├── mod.rs
│       │   ├── spooler.rs           # trait Spooler
│       │   ├── spooler_windows.rs
│       │   ├── spooler_cups.rs
│       │   └── coletor.rs           # task em segundo plano
│       ├── modelos/                 # structs/DTOs
│       │   ├── mod.rs
│       │   ├── impressora.rs
│       │   ├── trabalho.rs
│       │   ├── suprimento.rs
│       │   ├── usuario.rs
│       │   └── relatorio.rs
│       └── util/
│           ├── mod.rs
│           ├── datas.rs
│           └── validacao.rs
│
├── src/                             # FRONTEND (React + TypeScript)
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── estilos/
│   │   ├── tokens.css               # variáveis do Design System
│   │   ├── global.css
│   │   └── componentes.css
│   ├── tipos/
│   │   ├── impressora.ts
│   │   ├── trabalho.ts
│   │   ├── suprimento.ts
│   │   └── relatorio.ts
│   ├── api/
│   │   ├── cliente.ts               # wrapper do invoke do Tauri
│   │   ├── impressoras.ts
│   │   ├── fila.ts
│   │   ├── suprimentos.ts
│   │   ├── usuarios.ts
│   │   └── relatorios.ts
│   ├── hooks/
│   │   ├── useImpressoras.ts
│   │   ├── useFila.ts
│   │   ├── useAlertas.ts
│   │   └── useEventos.ts            # escuta eventos Tauri
│   ├── estado/
│   │   ├── store.ts                 # Zustand
│   │   └── selects.ts
│   ├── componentes/                 # componentes reutilizáveis
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/
│   │   │   ├── Botao.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CardKPI.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tabela.tsx
│   │   │   ├── BarraProgresso.tsx
│   │   │   ├── Campo.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Grafico.tsx
│   │   └── especificos/
│   │       ├── CartaoImpressora.tsx
│   │       ├── LinhaTrabalho.tsx
│   │       ├── IndicadorSuprimento.tsx
│   │       └── PainelDetalhes.tsx
│   ├── paginas/
│   │   ├── VisaoGeral.tsx
│   │   ├── FilaImpressao.tsx
│   │   ├── Impressoras.tsx
│   │   ├── Suprimentos.tsx
│   │   ├── Relatorios.tsx
│   │   ├── UsuariosCotas.tsx
│   │   └── Configuracoes.tsx
│   └── rotas.tsx
│
├── public/
│   └── fonts/                       # Inter (local, opcional)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## 3. Responsabilidades por Pasta

| Pasta | Responsabilidade |
| --- | --- |
| `src-tauri/src/comandos` | Expor operações ao frontend via IPC, validar entrada |
| `src-tauri/src/servicos` | Regras de negócio puras (testáveis) |
| `src-tauri/src/repositorio` | Consultas SQL e mapeamento para modelos |
| `src-tauri/src/integracao` | Comunicação com spooler/CUPS e coleta em background |
| `src-tauri/src/modelos` | Estruturas de dados e DTOs compartilhados |
| `src/componentes/ui` | Componentes genéricos do Design System |
| `src/componentes/especificos` | Componentes de domínio do Print 360 |
| `src/paginas` | Telas mapeadas 1:1 com os SVGs de alta fidelidade |
| `src/api` | Camada de acesso aos comandos Tauri |

---

## 4. Observações

- O backend **nunca** acessa o banco diretamente do frontend — toda persistência passa por comandos;
- Cada tela em `src/paginas` corresponde a um SVG em `02_design/svgs/`;
- As migrations são aplicadas automaticamente na inicialização do `AppState`.

---

*Aquino Consultoria — tecnologia com propósito.*
