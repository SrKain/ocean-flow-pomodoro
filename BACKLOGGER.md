# BACKLOGGER.md — Registro Operacional de Tarefas e Backlog

> **REGRA ABSOLUTA DE GOVERNANÇA**:
> 1. **NADA PODE SER DELETADO DESTE ARQUIVO.**
> 2. Uma tarefa nunca deve desaparecer do documento.
> 3. Se uma tarefa for cancelada, descartada ou substituída, seu status deve ser alterado mantendo o histórico completo da alteração com data e justificativa.
> 4. Nenhuma IA tem autorização para apagar ou reescrever silenciosamente registros existentes.
> 5. Novas tarefas, débitos técnicos e sugestões devem ser acrescentados sequencialmente.

---

## Estrutura de Status

- **Concluído**: Tarefas totalmente finalizadas, testadas e validadas.
- **Em andamento**: Tarefas que possuem aprovação expressa do usuário e estão sob execução.
- **Planejado**: Tarefas aprovadas pelo usuário que aguardam janela de execução.
- **Bloqueado**: Tarefas com impedimento técnico ou dependência externa não resolvida.
- **Descontinuado / Cancelado / Descartado**: Tarefas que deixaram de fazer sentido (mantidas integralmente no histórico).
- **Sugestão / Não Aprovado**: Recomendações técnicas e levantamentos que ainda **NÃO possuem aprovação** do usuário.

---

## 1. Tarefas Concluídas

### BL-001 — Implantação da Governança de Desenvolvimento e IA
- **Status**: Concluído
- **Tipo**: Governança / Documentação
- **Solicitado por**: Usuário
- **Data de Conclusão**: 2026-10-08
- **Descrição**: Criação dos documentos normativos e operacionais de governança (`README.md`, `CERME.md`, `BACKLOGGER.md`, `STORY.md`), catalogação profunda de todas as 26 funcionalidades existentes do sistema, definição do fluxo obrigatório em 4 etapas (Leitura, Planejamento, Aprovação, Execução) e estabelecimento da regra de ouro de rastreabilidade.
- **Story Relacionado**: STORY-0001
- **Histórico**:
  - 2026-10-08: Criada e concluída na implantação da governança.

### BL-002 — Normalização de Runtime Web e Resiliência Offline
- **Status**: Concluído
- **Tipo**: Infraestrutura / Runtime
- **Solicitado por**: Importação de repositório / Ambiente AI Studio
- **Data de Conclusão**: 2026-10-08
- **Descrição**: Remoção de artefatos de lockfile incompatíveis (`bun.lockb`), parametrização de bind de host (`0.0.0.0`) e porta (`3000`) no `vite.config.ts` e `package.json`, criação de `metadata.json` sincronizado com meta-tags de `index.html`, e blindagem da camada de dados (`supabase/client.ts`, `useAuth.tsx`, `useSessionSync.ts`, `database.ts`, `storage.ts`) para suportar modo offline/convidado e falhas de rede sem quebrar o timer.
- **Story Relacionado**: STORY-0001
- **Histórico**:
  - 2026-10-08: Criada e concluída no baseline de importação.

### BL-011 — Auditoria de UI/UX e Arquitetura de Reforma
- **Status**: Concluído
- **Tipo**: Auditoria / Arquitetura
- **Solicitado por**: Usuário
- **Data de Conclusão**: 2026-10-08
- **Descrição**: Auditoria detalhada do repositório identificando problemas de scroll bloqueado, classes CSS inexistentes, duplicidade de árvores no PomodoroTimer, fragmentação de breakpoints, janela de PiP rígida e ausência de semântica acessível. Estabelecimento do plano estruturado de 8 etapas de reforma (E0 a E7).
- **Histórico**:
  - 2026-10-08: Concluída e aprovada para execução das etapas BL-012 a BL-019.

### BL-012 — E0: Fundações de Layout, Viewport, Variantes de Botão e Estilos
- **Status**: Concluído
- **Tipo**: Reforma UI/UX / Fundações
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Data de Conclusão**: 2026-10-09
- **Story Relacionado**: STORY-0002
- **Relacionado a**: BL-011, CERME (MEC-001, MEC-006, MEC-024)
- **Descrição**: Liberar scroll vertical nas páginas de conteúdo (Dashboard, Resumo, Configurações, Auth) removendo overflow:hidden global de index.html e mantendo travamento apenas na tela de foco. Normalizar safe-area-inset no shell sem duplicação em containers. Definir variantes do componente Button (primary, secondary, ghost, destructive) e substituir ios-button-* em Auth e PhasePopup. Trocar inputs e botões crus de Settings pelos componentes do sistema. Declarar keyframe scale-in no tailwind.config.ts e usar dvh nos max-h dos popups. Remover user-scalable=no do viewport (D4) e remover App.css não utilizado.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.
  - 2026-10-09: Concluída e validada na etapa E0 (STORY-0002).

### BL-013 — E1: Breakpoints Centralizados, Shell Compartilhado e Tokens de Fase
- **Status**: Concluído
- **Tipo**: Reforma UI/UX / Layout
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Data de Conclusão**: 2026-10-09
- **Story Relacionado**: STORY-0003
- **Relacionado a**: BL-011, CERME (MEC-002, MEC-006)
- **Descrição**: Criar hook de contexto único para faixas de viewport e altura compacta, unificando useIsMobile e useLandscapeMode. Criar shell de layout compartilhado (max 1440px) com fundo escuro consistente em Auth, Resumo e NotFound. Centralizar tokens de cores de fase em módulo único. Ajustar gráficos com aspect-ratio proporcional e rótulos legíveis.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.
  - 2026-10-09: Concluída e validada na etapa E1 (STORY-0003).

### BL-014 — E2: Tela de Foco Unificada, Dimensionamento Polar e Composição Modular
- **Status**: Concluído
- **Tipo**: Reforma UI/UX / Foco
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Data de Conclusão**: 2026-10-09
- **Story Relacionado**: STORY-0004
- **Relacionado a**: BL-011, CERME (MEC-001, MEC-002, MEC-003, MEC-006)
- **Descrição**: Substituir as duas árvores JSX de PomodoroTimer por uma única composição CSS/hook. Modularizar PomodoroTimer em TimerHeader, FocusContextPanel e TimerModals. Anel com dimensionamento proporcional clamp/dvh e tipografia tabular-nums. Duas colunas em desktop/paisagem e layout compacto sem scroll com sheet de Contexto em mobile retrato. Persistir seleções de tags e notas na sessão localmente. Corrigir MEC-006 no CERME.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.
  - 2026-10-09: Concluída e validada na etapa E2 (STORY-0004).


---

## 2. Tarefas em Andamento

*Registro anterior à aprovação de BL-011 em 2026-10-08: nenhuma tarefa em andamento.*
*(Nota de Governança: Nenhuma ação é iniciada sem aprovação prévia expressa do usuário).*

### BL-011 — Reforma Imersiva de UI/UX e Timer do Ocean Flow
- **Status**: Em andamento
- **Tipo**: Produto / Frontend / Timer / Persistência
- **Solicitado por**: Usuário
- **Data de Início**: 2026-10-08
- **Descrição**: Implementar o plano aprovado para tornar o Pomodoro a experiência principal mobile-first, fortalecer a engine temporal e recuperação/sincronização sem persistência por tick, organizar estados/transições e edição de duração, refinar Spotify e analytics, Dashboard, Daily Review, Settings, PiP e acessibilidade. Preservar funcionalidades, identidade oceânica, registros remotos/locais, suporte offline e integrações existentes. Recursos Spotify adicionais dependem da validação de API/escopos atuais.
- **Escopo/Fases**:
  - Fase 1: engine temporal, persistência compatível, estados, controles, edição de duração e avanço automático.
  - Fase 2: home imersiva, fullscreen responsivo, background e PolarRing.
  - Fase 3: Now Playing e analytics Spotify; controles adicionais somente se suportados.
  - Fase 4: Dashboard e Daily Review.
  - Fase 5: Settings.
  - Fase 6: PiP, acessibilidade e edge cases.
- **Documentos/Funcionalidades Relacionados**: CERME MEC-001 a MEC-026; atualização final do CERME e STORY após validação.
- **Histórico**:
  - 2026-10-08: plano aprovado explicitamente pelo usuário; execução iniciada pela Fase 1.


### BL-020 — Navegação, Overfocus, Padrões de Ciclo e Persistência Spotify
- **Status**: Em andamento (implementação concluída; validação de build pendente)
- **Tipo**: Correção de UX / Timer / Persistência
- **Solicitado por**: Usuário
- **Data de Início**: 2026-10-09
- **Relacionado a**: BL-011, BL-015, BL-017, BL-019; CERME (MEC-001, MEC-004, MEC-006, MEC-016, MEC-017, MEC-023)
- **Descrição**: Substituir atalhos do cabeçalho por navegação global em três destinos responsivos (Foco, Análises e Ajustes); manter o overfocus no timer, com botão visível de conclusão e registro do tempo extra; alinhar os padrões de duração em 5/30/10 minutos, migrando apenas os antigos padrões conhecidos e a sessão inicial parada; restaurar tokens Spotify do Supabase ou da cópia local do usuário, compartilhar renovações concorrentes e preservar credenciais em falhas temporárias.
- **Arquivos principais**: `PrimaryNavigation.tsx`, `AppShell.tsx`, `TimerHeader.tsx`, `PomodoroTimer.tsx`, `TimerModals.tsx`, `useSpotify.tsx`, `useSessionSync.ts`, `database.ts`, `storage.ts`, `Settings.tsx`, `Dashboard.tsx`.
- **Histórico**:
  - 2026-10-09: Implementação aprovada e concluída; build pendente porque npm e node_modules não estão disponíveis no ambiente (STORY-0005).

### BL-021 — Correções de Dados, Insights, Rotas, Email e Missões
- **Status**: Em andamento (correções de código implementadas; configuração remota e publicação pendentes de confirmação)
- **Tipo**: Correção / Persistência / Integrações / Navegação
- **Solicitado por**: Usuário
- **Data de Início**: 2026-10-09
- **Relacionado a**: CERME (MEC-015, MEC-019, MEC-022, MEC-023, MEC-025, MEC-026)
- **Descrição**: Corrigir incompatibilidade de UUID e agregação/fallback de ciclos que impediam o Dashboard de mostrar dados; expor estados vazios/erros dos Insights IA; adicionar fallback SPA para URLs diretas; centralizar missões com armazenamento local por usuário convidado e alinhar o Resumo Diário; melhorar o diagnóstico do envio de email e rejeitar autenticação inválida sem permitir que uma chamada individual seja interpretada como envio em lote. A confirmação de Secrets SMTP/IA, migrações no Supabase ativo e comportamento de publicação do Lovable Cloud depende do ambiente remoto.
- **Arquivos principais**: `src/lib/database.ts`, `src/lib/tasks.ts`, `src/pages/Dashboard.tsx`, `src/pages/DailySummary.tsx`, `src/components/AIInsightsCard.tsx`, `src/components/MissionsPopup.tsx`, `src/components/MissionsWidget.tsx`, `src/pages/Settings.tsx`, `supabase/functions/daily-email-summary/index.ts`, `public/_redirects`.
- **Histórico**:
  - 2026-10-09: Plano aprovado expressamente pelo usuário; implementação iniciada (STORY-0006).

### BL-022 — Refatoração de Confiabilidade do Timer, Dados e Integrações
- **Status**: Em andamento (E1–E3 implementadas localmente; E4 depende de configuração externa; E0/E5 e publicação ainda pendentes)
- **Tipo**: Refatoração de arquitetura / Persistência / Sincronização / Integrações
- **Solicitado por**: Usuário
- **Data de Início**: 2026-10-09
- **Relacionado a**: BL-011, BL-020, BL-021; CERME (MEC-001, MEC-015, MEC-016, MEC-019, MEC-022, MEC-023, MEC-025, MEC-026)
- **Descrição**: Tornar o timer baseado em transições e timestamps, confiável após pausa, recarga, offline e uso em múltiplas abas/dispositivos; persistir cada ciclo localmente e sincronizá-lo de forma idempotente; unificar a origem dos relatórios; estabilizar sessão Spotify, Insights IA e envio de email; melhorar estados e feedback de sincronização. Preservar os dados atuais. Avaliar migração de banco somente após auditar schema, migrações, RLS, secrets e confiabilidade do Supabase ativo.
- **Etapas**:
  - E0: Diagnóstico do estado real do Supabase/deploy e inventário de dados locais/remotos; backup verificável.
  - E1: Máquina de estados temporal, atualização por eventos e reconciliação entre recarga, abas e dispositivos.
  - E2: Outbox e upsert idempotente para ciclos; relatórios derivados de um repositório canônico.
  - E3: Integração Spotify com estados recuperáveis; separar rastreamento de faixa de comandos do player.
  - E4: Robustez de relatórios/Insights/email, configuração de funções e respostas de erro.
  - E5: Validação de fluxos, lançamento gradual, documentação e decisão final sobre banco.
- **Decisão inicial de banco**: Manter Supabase durante E0–E4. Migração só será recomendada se evidência operacional ou limitação comprovada justificar o custo de substituir Auth, Postgres, Realtime e Edge Functions.
- **Histórico**:
  - 2026-10-09: Plano completo aprovado expressamente pelo usuário; E0/E1 iniciadas.
  - 2026-10-09: Timer baseado em timestamps, revisão CAS e retomada local implementados; ciclos remotos passaram a usar outbox com upsert idempotente; relatórios passaram a derivar do repositório híbrido canônico; restauração da sessão Spotify prioriza tokens locais e renovação tem cooldown. Migração aditiva registrada. Acesso remoto/backup, secrets SMTP/IA e deploy não puderam ser confirmados; build bloqueado pela verificação de cache nativo do SWC no Windows.
---

## 3. Tarefas Planejadas (Aprovadas)

### BL-015 — E3: Navegação Unificada em 3 Destinos e Acomodação Responsiva
- **Status**: Planejada
- **Tipo**: Reforma UI/UX / Navegação
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Relacionado a**: BL-011, CERME (MEC-001, MEC-019, MEC-022, MEC-023)
- **Descrição**: Estruturar navegação em três destinos: Foco, Análises e Ajustes. Barra inferior em telas < 900px recolhida com timer rodando; rail lateral para >= 900px. Mover PiP para controle do timer e Missões/Tags para sheet. Timer ininterrupto entre rotas. Remover duplicidade de evolução diária entre Resumo e Dashboard. NotFound em português no tema do app. Padronizar nome Ocean Flow.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.
  - 2026-10-09: Barra inferior/rail em três destinos implementada em STORY-0005; PiP no controle do timer e demais itens da etapa permanecem pendentes.

### BL-016 — E4: Arquitetura de Picture-in-Picture Desacoplada e Mini-Timer Fallback
- **Status**: Planejada
- **Tipo**: Reforma UI/UX / PiP
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Relacionado a**: BL-011, CERME (MEC-005)
- **Descrição**: Elevar instância de PiP para cima do shell. Três layouts responsivos (mínimo <= 160px, padrão 160-280px, ampliado > 280px) com unidades relativas (cqmin/vmin). Sincronizar currentTrack em todas as orientações. Confirmação ao pular por PiP. Atualização de janela por referência. Implementar fallback de PiP como mini-timer na própria página conforme D6. Atualizar MEC-005 no CERME ao concluir.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.

### BL-017 — E5: Ajustes de Fluxo, Transições de Fase, Overfocus e Configurações
- **Status**: Planejada
- **Tipo**: Reforma UI/UX / Fluxo
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Relacionado a**: BL-011, CERME (MEC-001, MEC-003, MEC-004, MEC-023)
- **Descrição**: Play após conclusão abre próxima fase. Overfocus ajustado conforme decisão D3 (parar antes para perguntar ao usuário). Confirmação de reset/edição quando há progresso. Validação de inputs em Settings ao sair do campo (sem fallback ao apagar) e unificação de limites com constante compartilhada.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.
  - 2026-10-09: Overfocus atualizado em STORY-0005 para permanecer no timer com ação direta de conclusão; os demais itens da etapa permanecem pendentes.

### BL-018 — E6: Acessibilidade WCAG AA, Diálogos Radix, Semântica e Reduced Motion
- **Status**: Planejada
- **Tipo**: Acessibilidade / UI
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Relacionado a**: BL-011, CERME (MEC-001, MEC-002, MEC-009, MEC-013, MEC-015)
- **Descrição**: Atribuir role="timer" e aria-live="polite". Migrar popups customizados para base Radix (Dialog/Sheet) com foco preso, aria-modal e tecla Esc. Exclusão de tags fora do botão principal. Rótulos aria-label em controles iconográficos. Alvos de toque de no mínimo 44px e respeito a prefers-reduced-motion.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.

### BL-019 — E7: Resiliência de Integrações (Spotify, Notificações, Offline e Convidado)
- **Status**: Planejada
- **Tipo**: Integrações / Resiliência
- **Solicitado por**: Usuário (Reforma de UI/UX)
- **Relacionado a**: BL-011, CERME (MEC-008, MEC-014, MEC-016, MEC-024, MEC-026)
- **Descrição**: Tratamento de estados do Spotify (desconectado, conectado sem faixa, tocando, erro). Exibir status de permissão de notificações em Ajustes. DailyRatingPrompt sem cobrir sessão em andamento (D7). Fallbacks locais para tags/missões em modo convidado e avisos de dados locais conforme D5.
- **Histórico**:
  - 2026-10-08: Registrada como Planejada com aprovação do usuário.
  - 2026-10-09: Tokens Spotify agora têm cópia local de contingência e renovação resiliente (STORY-0005); os demais itens da etapa permanecem pendentes.

---

## 4. Tarefas Bloqueadas

*Nenhum bloqueio registrado no momento.*

---

## 5. Tarefas Descontinuadas / Canceladas

*Nenhuma tarefa descontinuada até o momento. (Registros futuros cancelados devem permanecer aqui com data e motivo).*

---

## 6. Problemas Identificados e Débitos Técnicos (Sugestões / Não Aprovadas)

> **ATENÇÃO**: Os itens a seguir foram catalogados durante a auditoria técnica da base de código. Nenhum deles foi aprovado para execução nem alterado nesta etapa. Permanecem como diagnósticos para decisão do usuário.

### BL-003 [Sugestão / Não Aprovado] — Remoção de Dependências e Configurações Residuais de Capacitor Mobile
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Débito Técnico / Limpeza
- **Identificado em**: 2026-10-08
- **Descrição**: O projeto possui pastas `/android/` e dependências `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` no `package.json`, além de `capacitor.config.ts`, resultantes de exportação de plataforma móvel, enquanto a aplicação roda como SPA web pura.
- **Impacto**: Aumento do tamanho do repositório e tempos de build/instalação.
- **Ação sugerida**: Avaliar se o suporte a APK nativo via Capacitor ainda é desejado; caso não seja, planejar remoção limpa após aprovação do usuário.

### BL-004 [Sugestão / Não Aprovado] — Tipagem Estrita e Desacoplamento no Hook useSessionSync
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Débito Técnico / Refatoração
- **Identificado em**: 2026-10-08
- **Descrição**: O hook `useSessionSync` faz casts do tipo `as unknown as ActiveSession` ao receber dados brutos do Supabase.
- **Impacto**: Risco de inconsistências em tempo de execução caso a coluna remota divirja de tipos esperados no frontend.
- **Ação sugerida**: Implementar parser/validador Zod leve para dados de sessão ativa.

### BL-005 [Sugestão / Não Aprovado] — Tratamento de Erro de Conexão Spotify quando em Modo Offline
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Melhoria de UX / Robustez
- **Identificado em**: 2026-10-08
- **Descrição**: No hook `useSpotify.tsx`, chamadas para carregar tokens buscam exclusivamente a tabela `spotify_connections` do Supabase. Em modo convidado ou offline, não há indicação clara na UI de que a integração com o Spotify exige conexão à nuvem.
- **Impacto**: O usuário pode clicar no botão do Spotify em modo convidado e não obter feedback explícito.
- **Ação sugerida**: Adicionar badge ou aviso informativo no card `NowPlaying` indicando que a sincronização do Spotify requer conta remota conectada.

### BL-006 [Sugestão / Não Aprovado] — Otimização de Polling do Spotify Player
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Performance
- **Identificado em**: 2026-10-08
- **Descrição**: O hook `useSpotify` realiza polling contínuo para verificar a música atual quando conectado.
- **Impacto**: Consumo constante de requisições de rede mesmo se o timer estiver pausado por longos períodos.
- **Ação sugerida**: Suspender o polling quando o timer estiver pausado ou a janela estiver em segundo plano prolongado.

### BL-007 [Sugestão / Não Aprovado] — Padronização de Componentes UI Toast (Sonner vs shadcn toast)
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Consistência de Código
- **Identificado em**: 2026-10-08
- **Descrição**: O projeto importa e monta tanto `sonner` quanto `@/components/ui/toaster` no `App.tsx`, e páginas diferentes usam chamadas diferentes (`toast` de sonner em `Settings.tsx` e `useToast` em `Auth.tsx`).
- **Impacto**: Duplicação de bibliotecas de notificação visual.
- **Ação sugerida**: Padronizar em uma única biblioteca de toast em toda a aplicação.

---

## 7. Ideias de Melhorias Futuras (Sugestões / Não Aprovadas)

### BL-008 [Sugestão / Não Aprovado] — Exportação de Relatórios de Produtividade em PDF / CSV
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Nova Funcionalidade
- **Identificado em**: 2026-10-08
- **Descrição**: Permitir que o usuário exporte o histórico de ciclos do `Dashboard` em formato CSV ou relatório PDF para arquivamento pessoal.

### BL-009 [Sugestão / Não Aprovado] — Sons Oceânicos e Ruído Branco Integrados (Ocean Ambient Audio)
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Nova Funcionalidade / Áudio
- **Identificado em**: 2026-10-08
- **Descrição**: Adicionar faixas de áudio geradas localmente via Web Audio API (som de ondas, maré suave, chuva leve) para quem não utiliza Spotify ou deseja sons imersivos de foco.

### BL-010 [Sugestão / Não Aprovado] — Modo PWA Completo com Service Worker Offline
- **Status**: Sugestão / Não Aprovado
- **Tipo**: Infraestrutura / PWA
- **Identificado em**: 2026-10-08
- **Descrição**: Adicionar manifesto PWA e service worker para possibilitar instalação direta na tela inicial de celulares Android/iOS como web app autônomo sem necessidade de Capacitor.
