# Print 360 — Gerenciador de Impressoras

> **Desenvolvido por Aquino Consultoria**
> Status: **v2.0.0 entregue ✅** — base ✅ · M1 ✅ · M2 ✅ · M3 ✅ · M4 ✅

O **Print 360** é uma aplicação desktop robusta para centralizar, monitorar e governar toda a frota de impressoras de uma organização. Construído sobre **Rust + SQLite + Tauri 2**, combina a segurança e o desempenho do backend nativo com uma interface moderna e de alta fidelidade.

---

## Propósito

Transformar a gestão de impressão — hoje fragmentada, reativa e sem visibilidade de custo — em uma operação **centralizada, proativa e mensurável**, com:

- Visão unificada de todas as impressoras (rede e locais);
- Controle total da fila de impressão (pausar, retomar, cancelar, reiniciar);
- Monitoramento de suprimentos e manutenção preditiva;
- Cotas por usuário/setor e rateio de custos;
- Alertas inteligentes e relatórios gerenciais.

---

## Stack Tecnológica

| Camada | Tecnologia | Função |
| --- | --- | --- |
| Shell / Desktop | **Tauri 2** | Janela nativa, IPC seguro, empacotamento multiplataforma |
| Backend | **Rust** | Lógica de negócio, integração CUPS/SPOOLER, coleta de métricas |
| Persistência | **SQLite** | Banco local embarcado, single-file, transacional |
| Frontend | TypeScript + React + Vite | Interface rica e responsiva |
| Estilização | CSS Tokens (Design System) | Consistência visual entre telas |

> O frontend e o design System são detalhados em `02_design/` e `01_planejamento/design_system/`.

---

## Estrutura do Repositório

```
print_360/
├── README.md                       ← este arquivo
├── 01_planejamento/                ← documentos de planejamento
│   ├── visao_produto/
│   ├── requisitos/
│   ├── arquitetura/
│   ├── design_spec/
│   └── design_system/
├── 02_design/                      ← artefatos visuais
│   ├── svgs/                       ← telas de alta fidelidade (SVG)
│   └── referencias/
├── 03_estrutura_projeto/           ← árvore de pastas/arquivos do código-fonte
└── 04_documentacao/                ← roadmap e documentação complementar
```

Cada documento de planejamento está em sua **pasta de competência**, conforme o princípio de organização adotado.

---

## Documentos de Planejamento

| Documento | Local | Conteúdo |
| --- | --- | --- |
| Visão Geral | `01_planejamento/visao_produto/visao_geral.md` | Propósito, personas, proposta de valor e escopo |
| Requisitos Funcionais | `01_planejamento/requisitos/requisitos_funcionais.md` | RF-001 a RF-... com histórias de usuário |
| Requisitos Não Funcionais | `01_planejamento/requisitos/requisitos_nao_funcionais.md` | Performance, segurança, compatibilidade |
| Arquitetura do Sistema | `01_planejamento/arquitetura/arquitetura_sistema.md` | Camadas Tauri 2, fluxo de dados, IPC |
| Modelo de Dados | `01_planejamento/arquitetura/modelo_dados.md` | Schema SQLite, DDL e diagrama ER |
| Design Spec | `01_planejamento/design_spec/design_spec.md` | Especificação detalhada das telas |
| Design System | `01_planejamento/design_system/design_system.md` | Tokens, componentes e regras visuais |
| Estrutura do Projeto | `03_estrutura_projeto/estrutura_projeto.md` | Árvore de pastas e arquivos do código |

---

## Telas de Alta Fidelidade (SVG)

As sete telas principais estão em `02_design/svgs/`:

1. `01_visao_geral.svg` — Dashboard com KPIs e status da frota
2. `02_fila_de_impressao.svg` — Gerenciamento da fila de trabalhos
3. `03_impressoras.svg` — Inventário e detalhes de impressoras
4. `04_suprimentos.svg` — Níveis de toner/ink/papel e alertas
5. `05_relatorios.svg` — Análise de custos e volume
6. `06_usuarios_e_cotas.svg` — Usuários, setores e cotas
7. `07_configuracoes.svg` — Preferências e parâmetros do sistema

---

## Como Executar

### Pré-requisitos
- Node.js 20+ e npm
- Rust estável (toolchain 1.77+) com MSVC Build Tools (Windows)
- WebView2 (presente no Windows 11)

### Instalação e execução

```bash
# Instalar dependências
npm install

# Rodar o frontend no navegador (usa dados de demonstração)
npm run dev

# Rodar a aplicação desktop completa (Tauri + Rust)
npm run tauri:dev

# Gerar o instalador
npm run tauri:build
```

> O banco SQLite é criado automaticamente em `%APPDATA%\print_360\print360.db` (Windows)
> ou `~/.local/share/print_360/print360.db` (Linux), com as migrations aplicadas na inicialização.

### Validações já executadas

| Comando | Resultado |
| --- | --- |
| `npm run build` | ✅ TypeScript + Vite sem erros |
| `cargo check` (em `src-tauri/`) | ✅ backend Rust sem erros |
| `cargo test` (em `src-tauri/`) | ✅ 11 testes aprovados (migrations, spooler, sincronização, custos, alertas, backup e auditoria) |
| Lighthouse (acessibilidade) | ✅ 1.00 · Boas Práticas 1.00 |

### Integração com o sistema (M2)
- **Windows:** cmdlets do módulo `PrintManagement` (`Get-Printer`, `Get-PrintJob`, `Suspend-PrintJob`, `Resume-PrintJob`, `Remove-PrintJob`) e `net pause/continue`.
- **Linux/macOS:** `lpstat`, `lp`, `cancel`, `cupsenable` e `cupsdisable`.
- Um coletor assíncrono sincroniza spooler → SQLite a cada 15 s e emite eventos
  `fila_atualizada`, `impressoras_atualizadas` e `alertas_atualizados` para o frontend.
- No navegador (`npm run dev`), as mesmas operações são simuladas com dados demo.

### Gestão e relatórios (M3)
- **Suprimentos:** níveis, previsão de esgotamento, registro de troca e alertas automáticos de nível baixo.
- **Usuários e cotas:** cadastro de usuários/setores, limites mensais, bloqueio opcional e alertas de excesso.
- **Custos:** parâmetros por página (P&B/cor), rateio por setor/impressora e evolução mensal.
- **Relatórios:** filtros por período e setor, gráficos e exportação CSV (diálogo nativo no Tauri, download no navegador).
- **Central de Alertas:** acessível pelo sino na topbar, com resolução de alertas e notificações nativas para eventos críticos.

### Instalador NSIS (gerado)
O instalador em português (PortugueseBR), para o usuário atual e sem exigir administrador, está em:

```
src-tauri/target/release/bundle/nsis/Print 360_2.0.0_x64-setup.exe
```

Tamanho: ~3,7 MB (inclui todos os módulos avançados). Basta executar o `.exe` e seguir o assistente; o atalho será criado
na pasta "Print 360" do menu Iniciar. O WebView2 é baixado automaticamente se necessário.

> **Nota sobre o Windows:** todos os processos externos usados na integração com o spooler
> são criados com a flag `CREATE_NO_WINDOW`, portanto **nenhuma janela do PowerShell pisca**
> durante a coleta (a cada 15 s). A sincronização também ocorre uma vez na inicialização,
> em vez de ser disparada a cada abertura de tela.

### Refino e entrega (M4)
- **Backup/restauração:** snapshot consistente via `VACUUM INTO`, validação do arquivo e limpeza dos sidecars WAL.
- **Auditoria:** todas as operações administrativas registradas com usuário, entidade e timestamp.
- **Acessibilidade:** WCAG AA (contraste ≥ 4.5:1), skip link, `aria-live`, `role="dialog"`, fechamento com `Esc` e respeito a `prefers-reduced-motion`.
- **Desempenho:** code-splitting com `React.lazy` — bundle inicial de 628 KB para 175 KB.
- **Empacotamento:** MSI/NSIS (Windows), DMG (macOS) e AppImage/deb (Linux) via Tauri 2.

---

## Recursos Avançados — Especificação e entrega

Os recursos avançados estão especificados e implementados em `05_avancado/`, com documentos em pastas de competência:

| Documento | Local |
| --- | --- |
| Visão Geral Recursos Avançados | `05_avancado/visao_produto/visao_geral_avancado.md` |
| Requisitos Funcionais | `05_avancado/requisitos/requisitos_funcionais_avancado.md` |
| Requisitos Não Funcionais | `05_avancado/requisitos/requisitos_nao_funcionais_avancado.md` |
| Arquitetura | `05_avancado/arquitetura/arquitetura_avancado.md` |
| Modelo de Dados | `05_avancado/arquitetura/modelo_dados_avancado.md` |
| Design Spec | `05_avancado/design_spec/design_spec_avancado.md` |
| Design System | `05_avancado/design_system/design_system_avancado.md` |
| Roadmap | `05_avancado/roadmap_avancado.md` |

**5 telas de alta fidelidade** em `02_design/svgs/avancado/`:
`08_manutencao_preditiva`, `09_saude_do_dispositivo`, `10_roteamento_inteligente`,
`11_sincronizacao_instalacoes` e `12_configuracoes_avancadas`.

Escopo: manutenção preditiva, roteamento inteligente e sincronização entre instalações — todos
com feature flags, sem exigir servidor e preservando a soberania dos dados locais.

### M1 — Manutenção Preditiva (implementado)
- Modelo heurístico plugável (`ModeloPreditivo`) com health score de 7 fatores explicáveis;
- Previsões por tambor, fusor, bandeja e papel, com nível de confiança;
- Tabelas `saude_dispositivo`, `previsoes_falha` e `ordens_servico` (migration 0004);
- Telas 08 e 09 com gauge acessível, "Por quê?" e criação de ordem de serviço;
- Predição ativa apenas quando a flag `f2_predicao_ativa` estiver habilitada.

### M2 — Roteamento Inteligente (implementado)
- Motor first-match com prioridade, 5 operadores de condição e 4 critérios de escolha;
- Simulação dry-run obrigatória: a regra só pode ser salva/ativada após simular;
- Justificativa registrada por decisão, fallback configurável e registro automático para novos trabalhos;
- Tela 10 com editor de regras, reordenação, toggle, painel de simulação e decisões recentes.

### M3 — Sincronização entre Instalações (implementado)
- Outbox versionado por entidade, transporte por arquivo (offline) e HTTP opcional com TLS;
- Cursor incremental, idempotência e políticas de conflito (manual, recente, origem);
- Eventos `sync_iniciada`, `sync_concluida` e `conflito_detectado`;
- Tela 11 com topologia das filiais, fila de mudanças, histórico de ciclos e revisão de conflitos;
- Nenhum documento ou dado de impressão trafega na sincronização.

### M4 — Configurações Avançadas e entrega (implementado)
- Tela 12 com feature flags e parâmetros dos três módulos, agrupados por domínio;
- Auditoria de alterações de configuração e persistência das preferências;
- Lighthouse 1.00 em acessibilidade, boas práticas e SEO nas novas telas;
- Versão final 2.0.0 e instalador NSIS em português;
- **Nenhum dado de impressão hardcoded nas telas:** KPIs, atividade, gráficos, níveis de
  suprimento, filtros, fallback de roteamento e fila de sincronização vêm de comandos Rust
  (`obter_atividade_recente`, `listar_outbox` e demais consultas existentes).
- **Módulo Impressoras:** busca por nome/modelo/endereço/setor, filtros de status e setor,
  estados de carregamento/erro/vazio e ficha técnica via `obter_detalhes_impressora`.

---

## Diretrizes

- **Idioma:** todo o conteúdo e a documentação em **português brasileiro (pt-br)**.
- **Nomenclatura:** pastas e arquivos de código em pt-br; identificadores de código seguem o padrão da linguagem (snake_case em Rust, camelCase em TS).
- **Estado:** aplicação completa, com código de produção, especificações, design system e protótipos vetoriais.

---

## Licença

Distribuído sob a licença **MIT**. Veja [`LICENSE`](./LICENSE).

---

*Aquino Consultoria — tecnologia com propósito.*
