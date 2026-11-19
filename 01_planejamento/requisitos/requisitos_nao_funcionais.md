# Requisitos Não Funcionais — Print 360

**Responsável:** Aquino Consultoria
**Status:** Planejamento
**Versão:** 1.0

---

## 1. Desempenho

| ID | Requisito | Meta |
| --- | --- | --- |
| RNF-001 | Tempo de inicialização da aplicação | < 3 s em hardware de referência |
| RNF-002 | Carregamento do dashboard com 100 impressoras | < 1,5 s |
| RNF-003 | Atualização de status da frota | Intervalo configurável, padrão 15 s |
| RNF-004 | Geração de relatório de 12 meses | < 2 s |
| RNF-005 | Consumo de memória em repouso | < 150 MB (processo Rust) |
| RNF-006 | Operações de banco | Consultas indexadas, < 100 ms para leituras comuns |

---

## 2. Segurança

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF-007 | IPC restrito | Tauri 2 com `capabilities` mínimas; nenhum comando exposto sem validação |
| RNF-008 | Validação de entrada | Todo payload vindo do frontend validado no Rust (tipos, limites, escape) |
| RNF-009 | Dados locais | Nenhum dado enviado a servidores externos sem consentimento explícito |
| RNF-010 | Arquivo do banco | Permissões restritas no sistema de arquivos; opção de criptografia em repouso (recursos avançados) |
| RNF-011 | Trilha de auditoria | Ações administrativas registradas com usuário e timestamp |
| RNF-012 | Atualizações | Verificação de integridade (hash/assinatura) antes de aplicar updates |

---

## 3. Compatibilidade

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF-013 | Sistemas operacionais | Windows 10/11 (x64), macOS 12+ (Intel/Apple Silicon), Linux (glibc, x64) |
| RNF-014 | Spoolers | Windows Print Spooler, CUPS (Linux/macOS) |
| RNF-015 | Resolução mínima | 1280 × 800; ideal 1440 × 900 ou superior |
| RNF-016 | DPI | Interface vetorial (SVG), nítida em telas de alta densidade |
| RNF-017 | Idioma | Português brasileiro (pt-br) como idioma padrão e principal |

---

## 4. Confiabilidade

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF-018 | Integridade do SQLite | Uso de WAL mode e transações para escritas críticas |
| RNF-019 | Recuperação | Recuperar de desligamento abrupto sem corromper o banco |
| RNF-020 | Tratamento de erro | Erros de integração com spooler não derrubam a aplicação |
| RNF-021 | Logs | Registro estruturado de erros para diagnóstico (arquivo local) |
| RNF-022 | Backup | Cópia automática configurável do banco |

---

## 5. Usabilidade

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF-023 | Consistência | Seguir rigorosamente o Design System (tokens e componentes) |
| RNF-024 | Acessibilidade | Contraste mínimo WCAG AA (4.5:1 para texto), navegação por teclado |
| RNF-025 | Feedback visual | Toda ação assíncrona exibe estado de carregamento e resultado |
| RNF-026 | Vocabulário | Termos consistentes em pt-br em toda a interface |
| RNF-027 | Temas | Tema claro por padrão; tema escuro planejado (recursos avançados) |

---

## 6. Manutenibilidade

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF-028 | Separação de camadas | Frontend desacoplado do backend via comandos Tauri |
| RNF-029 | Tipagem | Rust fortemente tipado; TypeScript estrito no frontend |
| RNF-030 | Testes | Cobertura mínima de 70% na lógica de negócio em Rust |
| RNF-031 | Documentação | Cada módulo público documentado; docs em pt-br |
| RNF-032 | Versionamento | Schema do banco versionado com migrations |

---

## 7. Empacotamento e Distribuição

| ID | Requisito | Detalhe |
| --- | --- | --- |
| RNF-033 | Instaladores | MSI/NSIS (Windows), DMG (macOS), AppImage/deb (Linux) |
| RNF-034 | Tamanho | Binário instalado < 80 MB (sem runtime externo pesado) |
| RNF-035 | Atualizações | Suporte ao plugin `updater` do Tauri 2 |

---

*Aquino Consultoria — tecnologia com propósito.*
