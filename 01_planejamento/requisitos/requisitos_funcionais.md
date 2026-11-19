# Requisitos Funcionais — Print 360

**Responsável:** Aquino Consultoria
**Status:** Planejamento
**Versão:** 1.0

---

## Legenda de Prioridade

| Nível | Significado |
| --- | --- |
| **Alta** | Essencial para o MVP |
| **Média** | Desejável na v1, pode ser adiado |
| **Baixa** | Recursos Avançados / aprimoramento |

---

## 1. Impressoras e Frota

### RF-001 — Descoberta automática de impressoras (Alta)
O sistema deve detectar automaticamente impressoras instaladas e na rede local, exibindo modelo, endereço, status e capacidades.

**História:** *Como administrador, quero descobrir impressoras automaticamente para não precisar cadastrá-las manualmente.*

**Critérios de aceite:**
- Listar impressoras do spooler do SO;
- Detectar dispositivos na sub-rede por protocolos suportados;
- Marcar dispositivos já cadastrados para evitar duplicidade.

### RF-002 — Cadastro manual de impressora (Alta)
Permitir adicionar impressora por endereço IP, hostname ou porta compartilhada, com nome amigável e setor associado.

### RF-003 — Status em tempo real (Alta)
Exibir estado operacional: Pronta, Ocupada, Erro, Pausada, Offline, Manutenção.

### RF-004 — Detalhes da impressora (Alta)
Painel de detalhes com: modelo, serial, firmware, endereço, níveis de suprimento, fila atual e histórico de trabalhos.

### RF-005 — Ações sobre a impressora (Alta)
Pausar, retomar, limpar fila e reiniciar o dispositivo (quando suportado).

---

## 2. Fila de Impressão

### RF-006 — Listagem da fila (Alta)
Exibir todos os trabalhos pendentes e em andamento com: documento, usuário, impressora, páginas, tamanho, horário, status e progresso.

### RF-007 — Controle de trabalhos (Alta)
Pausar, retomar, cancelar e reenviar trabalhos individualmente ou em lote.

### RF-008 — Reordenação da fila (Média)
Permitir alterar a prioridade de trabalhos (mover para o topo / atrasar).

### RF-009 — Filtros e busca (Alta)
Filtrar por status, impressora, usuário e período; buscar por nome de documento.

### RF-010 — Histórico de trabalhos (Alta)
Registrar trabalhos concluídos, cancelados e falhados com dados de custo e duração.

---

## 3. Suprimentos e Manutenção

### RF-011 — Monitoramento de suprimentos (Alta)
Acompanhar níveis de toner/ink, tambor, papel e grampos, com percentual e previsão de esgotamento.

### RF-012 — Alertas de nível baixo (Alta)
Gerar alerta quando um suprimento atingir limite configurável (padrão: 20%).

### RF-013 — Registro de manutenção (Média)
Registrar trocas de suprimentos e intervenções técnicas com data, responsável e observações.

### RF-014 — Manutenção preditiva (Baixa)
Estimar data de próxima manutenção com base no volume histórico e desgaste.

---

## 4. Usuários, Setores e Cotas

### RF-015 — Gestão de usuários (Alta)
Cadastrar usuários, vincular a setores e definir permissões (administrador, gestor, usuário).

### RF-016 — Gestão de setores (Média)
Criar setores/departamentos para organizar usuários e ratear custos.

### RF-017 — Cotas de impressão (Alta)
Definir limite mensal de páginas por usuário ou setor, com bloqueio ou aviso ao exceder.

### RF-018 — Consumo individual (Alta)
Exibir para cada usuário seu consumo atual, cota restante e histórico.

---

## 5. Custos e Relatórios

### RF-019 — Cálculo de custo por página (Alta)
Calcular custo por página com base em parâmetros configuráveis (toner, papel, manutenção por página).

### RF-020 — Relatório de volume (Alta)
Gerar relatório de páginas impressas por período, impressora, usuário e setor.

### RF-021 — Relatório de custos (Alta)
Gerar relatório de custos com rateio por setor e evolução mensal.

### RF-022 — Exportação (Média)
Exportar relatórios em CSV e PDF.

### RF-023 — Painel de indicadores (Alta)
Dashboard com KPIs: total impresso, custo do mês, impressoras ativas, fila pendente, alertas.

---

## 6. Alertas e Notificações

### RF-024 — Central de alertas (Alta)
Listar alertas de suprimento, erro de impressora, fila travada e cota excedida.

### RF-025 — Notificações do sistema (Média)
Exibir notificações nativas do SO para eventos críticos.

### RF-026 — Configuração de limites (Alta)
Permitir configurar limites e canais de alerta por tipo de evento.

---

## 7. Configurações e Administração

### RF-027 — Preferências gerais (Alta)
Idioma (pt-br), tema, formato de data, atualização automática de status.

### RF-028 — Parâmetros de custo (Alta)
Configurar custo por página, por suprimento e percentages de rateio.

### RF-029 — Usuários e permissões (Alta)
Gerenciar contas locais e níveis de acesso às funcionalidades.

### RF-030 — Backup e restauração (Média)
Exportar e importar o banco SQLite e configurações.

### RF-031 — Trilha de auditoria (Média)
Registrar ações administrativas relevantes (quem cancelou um trabalho, quem alterou uma cota).

---

## 8. Integração com o Sistema

### RF-032 — Integração com spooler (Alta)
Comunicar-se com CUPS (Linux/macOS) e Windows Print Spooler para listar filas e controlar trabalhos via Rust.

### RF-033 — Execução em segundo plano (Média)
Coletar métricas e atualizar status mesmo com a janela minimizada (via Tauri 2).

---

## Matriz de Rastreabilidade (resumo)

| Épico | Requisitos | Telas relacionadas |
| --- | --- | --- |
| Frota | RF-001 a RF-005 | Impressoras, Visão Geral |
| Fila | RF-006 a RF-010 | Fila de Impressão |
| Suprimentos | RF-011 a RF-014 | Suprimentos |
| Usuários | RF-015 a RF-018 | Usuários e Cotas |
| Custos | RF-019 a RF-023 | Relatórios, Visão Geral |
| Alertas | RF-024 a RF-026 | Visão Geral, Central de Alertas |
| Configuração | RF-027 a RF-031 | Configurações |
| Sistema | RF-032, RF-033 | (backend) |

---

*Aquino Consultoria — tecnologia com propósito.*
