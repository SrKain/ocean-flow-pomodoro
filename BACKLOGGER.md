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

---

## 3. Tarefas Planejadas (Aprovadas)

*Nenhuma tarefa planejada aguardando execução aprovada pelo usuário no momento.*

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
