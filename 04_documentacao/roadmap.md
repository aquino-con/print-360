# Roadmap — Print 360

**Responsável:** Aquino Consultoria
**Marco atual:** v2.0.0 entregue ✅ — todos os módulos concluídos
**Versão:** 2.0

---

## Status geral

| Marco | Status | Entregáveis |
| --- | --- | --- |
| Planejamento | ✅ Concluído | Visão, requisitos, arquitetura, modelo de dados, design spec, design system, SVGs, estrutura |
| Fundação (M1) | ✅ Concluído | Setup Tauri 2, Rust, SQLite + migrations, comandos IPC, tokens CSS, layout e 7 telas base |
| Frota e Fila (M2) | ✅ Concluído | Adaptadores Windows/CUPS, sincronização em segundo plano, eventos, operações de fila e frota |
| Suprimentos/Custos (M3) | ✅ Concluído | Services de suprimentos/cotas/custos, relatórios com CSV, central de alertas e notificações |
| Configuração/Refino (M4) | ✅ Concluído | Backup/restauração, auditoria, acessibilidade AA, code-splitting e empacotamento |
| **v1.0** | ✅ **Entregue** | Planejamento + M1 + M2 + M3 + M4 |
| Recursos avançados (M1–M4) | ✅ Concluídos | Preditiva, roteamento, sincronização e configurações avançadas |
| **v2.0.0** | ✅ **Entregue** | Todos os módulos + instalador NSIS em português |

### Validação do M2
- `cargo check`: ✅ sem erros
- `cargo test`: ✅ 7/7 testes aprovados (migrations, mapeamento de status, sincronização com spooler fictício)
- `npm run build`: ✅ TypeScript + Vite sem erros
- Navegador: ✅ pausar trabalho e cadastrar impressora funcionais, sem erros de console

### Validação do M3
- `cargo check`: ✅ sem erros
- `cargo test`: ✅ 9/9 testes aprovados (+ relatório/CSV e alertas de suprimento)
- `npm run build`: ✅ TypeScript + Vite sem erros
- Navegador: ✅ central de alertas (resolver), registrar troca, editar cota e exportar CSV funcionais; zero erros de console

### Validação do M4
- `cargo test`: ✅ 11/11 testes aprovados (+ validação de backup e auditoria)
- `npm run build`: ✅ sem avisos de chunk grande (bundle inicial 628 KB → 175 KB)
- Navegador: ✅ exportar backup, confirmar restauração, trilha de auditoria e fechar modal com `Esc`
- Lighthouse: ✅ **Acessibilidade 1.00**, Boas Práticas 1.00
- Motor de acessibilidade: ✅ WCAG AA aplicado (contraste ≥ 4.5:1, skip link, `aria-live`, `role="dialog"`, movimento reduzido)

---

## Marcos (Milestones)

### M0 — Planejamento (atual)
- [x] Documento de visão
- [x] Requisitos funcionais e não funcionais
- [x] Arquitetura do sistema
- [x] Modelo de dados com DDL
- [x] Design spec
- [x] Design system
- [x] 7 telas de alta fidelidade em SVG
- [x] Estrutura de pastas e arquivos

### M1 — Fundação (2–3 semanas) — ✅ CONCLUÍDO
- [x] Inicializar projeto Tauri 2 + Vite + React + TS
- [x] Configurar Cargo.toml, tauri.conf.json, capabilities e ícones
- [x] Implementar AppState e conexão SQLite com WAL
- [x] Criar migrations iniciais (13 tabelas) com testes de idempotência
- [x] Implementar Layout (Sidebar + Topbar) e tokens CSS
- [x] Componentes UI base (Botão, Card, Badge, Barra, Campo, Toggle, Modal, Toast, Gráficos)
- [x] 7 telas React espelhando os SVGs aprovados
- [x] Camada de API Tauri com fallback de dados demo para navegador

### M2 — Frota e Fila (3–4 semanas) — ✅ CONCLUÍDO
- [x] Adaptadores de spooler (Windows via cmdlets PrintManagement; Linux/macOS via CUPS)
- [x] Migration 0002 (id_sistema, origem, índices únicos)
- [x] Comandos: listar/adicionar impressoras, pausar/retomar/limpar fila, pausar/retomar impressora
- [x] Comandos de fila: pausar, retomar, cancelar (com confirmação) e reiniciar trabalhos
- [x] Coletor em segundo plano (15 s) com sincronização transacional e eventos Tauri
- [x] Alertas automáticos de erro de impressora
- [x] Frontend reativo: uso de `useAtualizacoes`, ações com toast e modal de confirmação
- [x] Testes automatizados da sincronização e dos mapeamentos de status

### M3 — Suprimentos, Usuários e Custos (3–4 semanas) — ✅ CONCLUÍDO
- [x] Migration 0003 (colorida, índice de cota, setores e configurações iniciais)
- [x] Serviço de suprimentos: níveis, previsão, registro de troca e alertas de nível baixo
- [x] Serviço de custos: parâmetros, custo por página e relatório agregado
- [x] Serviço de usuários/cotas: cadastro, uso, limites e alertas de excesso
- [x] Serviço de alertas + central na topbar + notificações nativas no coletor
- [x] Exportação CSV (Rust + diálogo de salvamento; download no navegador)
- [x] Telas reais: Suprimentos, Usuários e Cotas, Relatórios e Configurações integradas
- [x] Testes automatizados dos novos serviços

### M4 — Configuração e Refino (2 semanas) — ✅ CONCLUÍDO
- [x] Backup via `VACUUM INTO` e restauração validada (com limpeza de sidecars WAL)
- [x] Trilha de auditoria registrada em todas as operações administrativas
- [x] Seção "Backup e Dados" na tela de Configurações + modais com `Esc`
- [x] Acessibilidade: skip link, `aria-live`, `role="dialog"`, foco visível, contraste WCAG AA, movimento reduzido
- [x] Code-splitting com `React.lazy` (bundle inicial reduzido em ~72%)
- [x] 11 testes automatizados no backend
- [x] Empacotamento Tauri 2 (MSI/NSIS · DMG · AppImage/deb)

### Conclusão
Todos os marcos foram concluídos e a **v2.0.0 está entregue**. Os recursos avançados
(manutenção preditiva, roteamento inteligente, sincronização entre instalações e configurações
avançadas) estão implementados e validados.

- Documentos: `05_avancado/` (visão, requisitos, arquitetura, modelo de dados, design spec,
  design system e roadmap);
- Protótipos: 5 SVGs em `02_design/svgs/avancado/`;
- Instalador: `Print 360_2.0.0_x64-setup.exe` (NSIS, português).

---

## Próximos Passos

1. Instalar o NSIS e validar o fluxo completo no ambiente do cliente;
2. Habilitar os módulos avançados conforme a necessidade de cada instalação;
3. Evoluir o adaptador de transporte HTTP para o ambiente de nuvem definitivo.

---

## Riscos

| Risco | Mitigação |
| --- | --- |
| Complexidade da API de spooler do Windows | Abstrair via trait e prototipar cedo |
| Mudanças no comportamento do CUPS entre distros | Testar em múltiplas distros no M2 |
| Escopo de relatórios crescer | Manter RF-019 a RF-022 no MVP, demais nos recursos avançados |

---

*Aquino Consultoria — tecnologia com propósito.*
