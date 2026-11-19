# Visão Geral do Produto — Print 360

**Projeto:** Print 360 — Gerenciador de Impressoras
**Responsável:** Aquino Consultoria
**Status:** Planejamento
**Versão do documento:** 1.0

---

## 1. Declaração de Visão

> *"Ser a plataforma desktop que transforma a impressão, de um custo operacional invisível e caótico, em um recurso governado, previsível e auditável — com um único painel para toda a frota."*

O Print 360 nasce para resolver uma dor real e persistente: em empresas de pequeno a grande porte, as impressoras são gerenciadas de forma reativa. Quando falta toner, quando a fila trava, quando o custo explode no fim do mês, ninguém tem dados para agir. O Print 360 traz **visibilidade, controle e inteligência** para esse domínio.

---

## 2. Problema

| # | Dor atual | Impacto |
| --- | --- | --- |
| P1 | Impressoras descobertas manualmente, sem inventário confiável | Ativos órfãos, difícil suporte |
| P2 | Filas de impressão opacas — não se sabe quem imprimiu o quê | Perda de tempo em suporte |
| P3 | Suprimentos esgotados sem aviso prévio | Interrupção de trabalho |
| P4 | Ausência de cotas e rateio por setor/usuário | Custos sem apropriação |
| P5 | Relatórios feitos à mão, em planilhas desatualizadas | Decisões lentas e imprecisas |
| P6 | Dependência de múltiplos utilitários de fabricantes | Curva de aprendizado e fragmentação |

---

## 3. Proposta de Valor

- **Centralização:** uma única janela para toda a frota, independente do fabricante.
- **Proatividade:** alertas de suprimentos e manutenção antes da falha.
- **Governança:** cotas, permissões e trilha de auditoria de cada trabalho.
- **Economia:** rateio de custo por página, usuário e setor — decisões baseadas em dados.
- **Segurança local:** dados permanecem no dispositivo; SQLite embarcado e IPC restrito do Tauri 2.

---

## 4. Personas

### 4.1 Ana — Administradora de TI (persona primária)
Responsável pela infraestrutura. Precisa ver status de todos os dispositivos, resolver filas travadas e ser alertada antes que problemas aconteçam. Valoriza confiabilidade e automação.

### 4.2 Carlos — Gestor Financeiro
Precisa entender quanto se gasta com impressão, por setor e por período, para ratear custos e negociar contratos. Valoriza relatórios claros e exportáveis.

### 4.3 Juliana — Usuária final
Imprime documentos no dia a dia. Precisa saber se seu trabalho foi concluído e quanto de sua cota resta, sem precisar entender detalhes técnicos.

### 4.4 Ricardo — Técnico de campo
Atende chamados de impressão. Precisa de histórico de falhas, níveis de suprimento e ações rápidas de manutenção.

---

## 5. Princípios de Produto

1. **Clareza antes de densidade:** informação técnica, mas legível à primeira olhada.
2. **Ação em um clique:** operações frequentes (pausar, cancelar, reiniciar) sempre acessíveis.
3. **Estado sempre visível:** nunca deixe o usuário adivinhar se um trabalho está em andamento.
4. **Dados pertencem ao usuário:** nada é enviado para a nuvem sem consentimento explícito.
5. **Natividade:** integração real com o spooler do sistema operacional via Rust.

---

## 6. Escopo

### 6.1 MVP (Versão 1.0)
- Descoberta e cadastro de impressoras (rede/local);
- Dashboard com status da frota e KPIs;
- Gerenciamento da fila de impressão;
- Monitoramento de suprimentos com alertas;
- Usuários, setores e cotas básicas;
- Relatórios de volume e custo;
- Configurações gerais e notificações.

### 6.2 Recursos Avançados (planejado)
- Manutenção preditiva com histórico de falhas;
- Regras de roteamento (imprimir em impressora mais próxima/disponível);
- Autenticação por badge/cartão;
- Exportação agendada de relatórios;
- Sincronização opcional entre instalações.

### 6.3 Fora de escopo
- Drivers de impressão proprietários (delegados ao SO);
- Gerenciamento de servidores de impressão remotos na v1;
- Aplicativo mobile.

---

## 7. Métricas de Sucesso

| Métrica | Meta |
| --- | --- |
| Tempo médio de resolução de fila travada | Redução de 70% |
| Impressoras com inventário atualizado | 100% |
|alertas de suprimento antes da falha | > 90% |
| Tempo de geração de relatório mensal | < 30 segundos |
| Satisfação dos administradores (pesquisa interna) | ≥ 4.5 / 5 |

---

## 8. Premissas e Restrições

- Ambientes alvo: Windows 10/11, macOS e Linux (via Tauri 2).
- Backend Rust deve compilar com toolchain estável.
- SQLite é a única fonte de verdade local; sem dependência de servidor de banco.
- A identidade visual seguirá o Design System descrito em `../design_system/design_system.md`.

---

*Aquino Consultoria — tecnologia com propósito.*
