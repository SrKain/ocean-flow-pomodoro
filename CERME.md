# CERME.md — Catálogo de Especificação e Registro de Mecânicas

> **Documento Normativo**: Este catálogo define o que o produto efetivamente faz, como funciona e quais regras governam cada uma de suas mecânicas. Nenhuma funcionalidade deve ser adicionada, alterada ou descontinuada sem o devido registro e sincronização neste documento.

---

## Sumário das Funcionalidades

1. [MEC-001 — Timer Pomodoro Tri-Fásico Oceânico](#mec-001--timer-pomodoro-tri-fásico-oceânico)
2. [MEC-002 — Interface Polar e Visualização do Timer](#mec-002--interface-polar-e-visualização-do-timer)
3. [MEC-003 — Controles de Operação do Timer](#mec-003--controles-de-operação-do-timer)
4. [MEC-004 — Modo Overfocus / Overtime](#mec-004--modo-overfocus--overtime)
5. [MEC-005 — Modo Picture-in-Picture (Document PiP e Video PiP)](#mec-005--modo-picture-in-picture-document-pip-e-video-pip)
6. [MEC-006 — Modo Paisagem e Tela Cheia](#mec-006--modo-paisagem-e-tela-cheia)
7. [MEC-007 — Prevenção de Bloqueio de Tela (Wake Lock API)](#mec-007--prevenção-de-bloqueio-de-tela-wake-lock-api)
8. [MEC-008 — Notificações de Navegador](#mec-008--notificações-de-navegador)
9. [MEC-009 — Seletor e Gestão de Tags de Foco](#mec-009--seletor-e-gestão-de-tags-de-foco)
10. [MEC-010 — Seletor de Tags e Ações de Mergulho](#mec-010--seletor-de-tags-e-ações-de-mergulho)
11. [MEC-011 — Seletor de Tags de Respiração e Estado Mental](#mec-011--seletor-de-tags-de-respiração-e-estado-mental)
12. [MEC-012 — Agrupamento de Tags (Tag Groups)](#mec-012--agrupamento-de-tags-tag-groups)
13. [MEC-013 — Avaliação de Ciclo de Foco (Rating 1 a 5 Estrelas)](#mec-013--avaliação-de-ciclo-de-foco-rating-1-a-5-estrelas)
14. [MEC-014 — Avaliação Diária de Qualidade](#mec-014--avaliação-diária-de-qualidade)
15. [MEC-015 — Widget e Modal de Missões Diárias](#mec-015--widget-e-modal-de-missões-diárias)
16. [MEC-016 — Integração Spotify (PKCE OAuth & Rastreamento de Faixa)](#mec-016--integração-spotify-pkce-oauth--rastreamento-de-faixa)
17. [MEC-017 — Barra de Reprodução Spotify (Now Playing)](#mec-017--barra-de-reprodução-spotify-now-playing)
18. [MEC-018 — Sincronização em Tempo Real de Sessão (Active Sessions)](#mec-018--sincronização-em-tempo-real-de-sessão-active-sessions)
19. [MEC-019 — Dashboard Analítico e Histórico](#mec-019--dashboard-analítico-e-histórico)
20. [MEC-020 — Correlação Música x Produtividade (Music Analytics)](#mec-020--correlação-música-x-produtividade-music-analytics)
21. [MEC-021 — Análise de Padrões Mentais (Breath Analytics)](#mec-021--análise-de-padrões-mentais-breath-analytics)
22. [MEC-022 — Resumo Diário Consolidado (Daily Summary)](#mec-022--resumo-diário-consolidado-daily-summary)
23. [MEC-023 — Configurações de Ciclos e Disparo de Relatório por Email](#mec-023--configurações-de-ciclos-e-disparo-de-relatório-por-email)
24. [MEC-024 — Autenticação e Gestão de Usuário (Supabase Auth + Modo Convidado)](#mec-024--autenticação-e-gestão-de-usuário-supabase-auth--modo-convidado)
25. [MEC-025 — Insights de Produtividade por IA (AI Insights)](#mec-025--insights-de-produtividade-por-ia-ai-insights)
26. [MEC-026 — Camada de Persistência Híbrida e Resiliência Offline](#mec-026--camada-de-persistência-híbrida-e-resiliência-offline)

---

## [MEC-001] Timer Pomodoro Tri-Fásico Oceânico

### Status
Ativa

### Objetivo
Orquestrar ciclos de produtividade divididos em três fases contínuas com tema marítimo: Imersão (planejamento/preparação), Mergulho (foco profundo de trabalho) e Respiração (pausa consciente e recuperação).

### Comportamento
O temporizador transita ciclicamente pelas fases: `immersion` → `dive` → `breath` → `immersion`. Cada fase tem duração parametrizável. A contagem é regressiva segundo a segundo. Ao término de uma fase, o sistema abre modal de transição (`PhasePopup`) ou avança o ciclo conforme configurado.

### Entrada
Comandos de início, pausa, reset ou avanço de fase acionados pelo usuário; durações configuradas em minutos.

### Saída
Contagem decrescente em segundos, alteração de estado da sessão, gatilho de transição de fase e persistência dos registros de ciclo (`cycle_records`).

### Regras
- Duração padrão de Imersão: 5 minutos.
- Duração padrão de Mergulho: 30 minutos.
- Duração padrão de Respiração: 10 minutos.
- Configurações persistidas que correspondam aos padrões antigos do sistema são migradas para os novos padrões; valores diferentes são preservados.
- Uma sessão inicial de Imersão parada, ainda sem ciclos, também recebe a duração atual configurada. Sessões em andamento ou já iniciadas são preservadas.
- Ciclo completado (`completed: true`) é registrado após conclusão de cada fase, sendo que um ciclo completo é contabilizado ao fechar a fase de respiração.
- Não permite valores de minutos menores que 1 minuto nas configurações.

### Estados
- Parado (`is_running: false`)
- Em execução (`is_running: true`)
- Em transição (exibindo `PhasePopup`)
- Em tempo extra (`is_overtime: true`)

### Interface
Rota principal `/`, componente `PomodoroTimer.tsx`.

### Dependências
`useSessionSync`, `database.ts`, `storage.ts`, `useWakeLock`, `useNotifications`.

### Arquivos relacionados
- `src/components/PomodoroTimer.tsx`
- `src/hooks/useSessionSync.ts`
- `src/lib/database.ts`
- `src/lib/storage.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).
- Padrões atualizados para 5/30/10 minutos e migração conservadora de valores antigos (STORY-0005).

---

## [MEC-002] Interface Polar e Visualização do Timer

### Status
Ativa

### Objetivo
Apresentar o tempo decorrido e restante através de anéis polares circulares com gradientes oceânicos e iluminação bioluminescente responsiva.

### Comportamento
O componente desenha arcos concêntricos em SVG (ou canvas) representando a proporção do tempo total da fase versus o tempo decorrido. No centro, são exibidos minutos e segundos formatados (`MM:SS`) e indicação de fase atual. Na fase de Respiração, o anel pulsa em ritmo de relaxamento respiratório.

### Entrada
Tempo restante em segundos, tempo total em segundos, fase atual (`immersion`, `dive`, `breath`), status de execução e status de overtime.

### Saída
Renderização visual animada do anel com brilhos glow nas cores específicas da fase (ciano/azul para Imersão e Mergulho; coral/âmbar para Respiração).

### Regras
- Quando `is_overtime` é verdadeiro, o anel exibe contagem crescente com sinal de `+` e cor de destaque pulsante.
- Mantém legibilidade de alto contraste mesmo em telas com brilho reduzido.

### Estados
- Regular decrescente
- Overtime crescente (`+MM:SS`)
- Pulsação suave (fase de Respiração)

### Interface
Centralizado na tela principal (`/`).

### Dependências
`lucide-react`, Tailwind CSS, `TimerDisplay.tsx`, `PolarRing.tsx`.

### Arquivos relacionados
- `src/components/PolarRing.tsx`
- `src/components/TimerDisplay.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-003] Controles de Operação do Timer

### Status
Ativa

### Objetivo
Prover botões intuitivos para controle da execução do temporizador.

### Comportamento
Disponibiliza ações:
- **Play/Pause**: Inicia ou pausa a contagem regressiva.
- **Pular Fase / Concluir**: Avança imediatamente para a próxima fase.
- **Reiniciar (Reset)**: Retorna o cronômetro para o início da fase atual ou reseta o ciclo.
- **Alternar PiP**: Abre ou fecha o mini-player Picture-in-Picture.
- **Alternar Paisagem/Tela Cheia**: Ativa o modo imersivo horizontal.

### Entrada
Cliques de mouse ou toques na tela nos botões de controle.

### Saída
Atualização do estado `is_running`, chamada da função `updateSession` ou navegação de estado.

### Regras
- Quando o timer está em execução, o botão principal assume o ícone de Pause; quando pausado, Play.
- O botão Reset quando em overtime cancela o tempo extra e reseta a fase.

### Estados
- Pausado
- Em execução
- Carregando/desabilitado

### Interface
Barra inferior de botões em `ControlButtons.tsx` dentro de `PomodoroTimer.tsx`.

### Dependências
`ControlButtons.tsx`, `useSessionSync.ts`.

### Arquivos relacionados
- `src/components/ControlButtons.tsx`
- `src/components/PomodoroTimer.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-004] Modo Overfocus / Overtime

### Status
Ativa

### Objetivo
Permitir que o usuário continue focado sem interrupção abrupta quando atingir o final da fase de Mergulho, contabilizando tempo extra de foco.

### Comportamento
Quando a contagem atinge `00:00` na fase de Mergulho, o timer entra em modo `Overtime`. O cronômetro passa a contar para cima (`+00:01`, `+00:02`...) acumulando `extra_time_seconds`. O timer permanece visível e oferece o botão **Concluir fase**, que encerra o overtime e registra o tempo extra sem abrir um popup cobrindo a tela.

### Entrada
Esgotamento do tempo regular da fase de mergulho.

### Saída
Sinalizador `is_overtime: true`, contagem de tempo extra acumulado e persistência no registro do ciclo.

### Regras
- O tempo extra é somado ao total de tempo focado nos relatórios.
- Ao concluir pelo controle na tela, o ciclo é gravado incluindo a duração regular + tempo extra e a transição de fase segue o fluxo existente.

### Estados
- Desativado (tempo regular)
- Ativado (contagem progressiva em vermelho/coral glow)
- Overfocus visível no timer com ação de conclusão

### Interface
Tela principal do timer (`PomodoroTimer.tsx`) e controle de conclusão da fase.

### Dependências
`useSessionSync.ts`, `PomodoroTimer.tsx`, `TimerModals.tsx`.

### Arquivos relacionados
- `src/hooks/useSessionSync.ts`
- `src/components/PomodoroTimer.tsx`
- `src/components/timer/TimerModals.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).
- Popup de overfocus removido do fluxo; botão de conclusão permanece na tela durante o overtime (STORY-0005).

---

## [MEC-005] Modo Picture-in-Picture (Document PiP e Video PiP)

### Status
Ativa

### Objetivo
Permitir que o usuário mantenha o temporizador visível em uma janela flutuante sempre no topo enquanto trabalha em outros aplicativos ou abas.

### Comportamento
Primeiro verifica se a API moderna `documentPictureInPicture` está disponível no navegador:
- Se suportada: Abre uma janela Document PiP contendo os elementos HTML reais do timer e botões funcionais.
- Se não suportada: Faz fallback para a API padrão HTMLVideoElement Picture-in-Picture desenhando o timer dinamicamente num canvas stream de vídeo.

### Entrada
Clique no botão PiP nos controles do timer.

### Saída
Abertura da janela flutuante com sincronização contínua do tempo e estado.

### Regras
- Ao fechar a janela flutuante, a visualização principal reassume o controle sem interrupção da contagem.
- O PiP mantém botões básicos de controle se executado via Document PiP.

### Estados
- Inativo
- Document PiP ativo
- Canvas Video PiP ativo

### Interface
Janela externa pop-out do navegador.

### Dependências
`DocumentPictureInPicture.tsx`, `PictureInPicture.tsx`.

### Arquivos relacionados
- `src/components/DocumentPictureInPicture.tsx`
- `src/components/PictureInPicture.tsx`
- `src/components/PomodoroTimer.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-006] Modo Paisagem e Tela Cheia

### Status
Ativa

### Objetivo
Otimizar a visualização do timer para suportar celulares e tablets em orientação horizontal (dock de mesa / modo descanso).

### Comportamento
A orientação e as faixas de viewport são detectadas dinamicamente via hook centralizado `useBreakpoint` (ao qual `useLandscapeMode` se conecta). O layout adapta-se de forma fluida: apresentação em duas colunas em desktop ou modo paisagem (coluna esquerda com anel polar, tempo e controles; coluna direita com painel de contexto de tags, notas e missões); e apresentação compacta de coluna única sem scroll vertical em modo retrato com acionamento do painel de contexto via gaveta/sheet inferior. Não há botão manual de tela cheia/fullscreen no código.
Uma navegação global apresenta três destinos — Foco, Análises e Ajustes — em barra inferior abaixo de 900 px e rail lateral a partir de 900 px. A rota `/summary` permanece acessível por um atalho dentro do Dashboard e marca Análises como destino ativo.

### Entrada
Giro físico do dispositivo móvel ou redimensionamento da janela do navegador (detecção automática por listeners de resize e orientationchange).

### Saída
Layout responsivo adaptativo com anel polar proporcional via clamp/dvh, tipografia tabular sem salto numérico e acomodação de contexto sem transbordamento de tela.

### Regras
- Em dispositivos móveis e tablets em modo paisagem ou desktops, o contexto é exibido em coluna lateral integrada.
- Em modo retrato móvel/compacto, a tela de foco preserva layout sem scroll com o painel de contexto acessível via sheet inferior.

### Estados
- Retrato (Portrait) com Sheet de Contexto
- Paisagem / Desktop com Duas Colunas

### Interface
Ajuste responsivo unificado de `PomodoroTimer.tsx`.

### Dependências
`useBreakpoint.tsx`, `useLandscapeMode.tsx`, `FocusContextPanel.tsx`, `TimerDisplay.tsx`, `PolarRing.tsx`.

### Arquivos relacionados
- `src/hooks/useBreakpoint.tsx`
- `src/hooks/useLandscapeMode.tsx`
- `src/components/PomodoroTimer.tsx`
- `src/components/timer/FocusContextPanel.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).
- Corrigido na etapa E2 (STORY-0004): remoção da menção a botão manual de fullscreen e documentação da composição modular responsiva com duas colunas e sheet.
- Navegação principal responsiva em três destinos registrada; resumo diário acessível a partir do Dashboard (STORY-0005).

---

## [MEC-007] Prevenção de Bloqueio de Tela (Wake Lock API)

### Status
Ativa

### Objetivo
Evitar que a tela do computador ou smartphone desligue ou entre em suspensão enquanto o cronômetro estiver em execução.

### Comportamento
O hook `useWakeLock` solicita `navigator.wakeLock.request('screen')` assim que `is_running` se torna `true`. Quando o cronômetro pausa ou a página perde o foco, o wake lock é liberado adequadamente para preservar bateria. Ao retornar o foco, se ainda estiver em execução, reassume a trava.

### Entrada
Estado booleano `isRunning` do timer.

### Saída
Chamada à API nativa do navegador `WakeLockSentinel`.

### Regras
- Se o navegador não suportar a Wake Lock API, falha silenciosamente sem gerar erros para o usuário.

### Estados
- Wake Lock adquirido
- Wake Lock liberado
- Não suportado

### Interface
Sem elemento visual direto (operação de background).

### Dependências
`useWakeLock.ts`.

### Arquivos relacionados
- `src/hooks/useWakeLock.ts`
- `src/components/PomodoroTimer.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-008] Notificações de Navegador

### Status
Ativa

### Objetivo
Avisar o usuário quando uma fase de foco, imersão ou respiração for concluída, mesmo se a aba estiver em segundo plano.

### Comportamento
Solicita permissão ao usuário (`Notification.requestPermission()`). Ao término de uma fase, emite notificações do sistema informando o término e o início da próxima etapa. Também dispara notificações quando o tempo entra em overfocus.

### Entrada
Término de fase ou gatilho de overfocus.

### Saída
Notificação nativa do sistema operacional / navegador com título e descrição.

### Regras
- Só emite se a permissão foi concedida (`Notification.permission === 'granted'`).
- Toca áudio suave de sino oceânico caso configurado.

### Estados
- Permissão pendente
- Permissão concedida
- Permissão negada

### Interface
Prompt nativo do navegador e toasts de feedback.

### Dependências
`useNotifications.ts`.

### Arquivos relacionados
- `src/hooks/useNotifications.ts`
- `src/components/PomodoroTimer.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-009] Seletor e Gestão de Tags de Foco

### Status
Ativa

### Objetivo
Permitir etiquetar os ciclos de imersão e foco com categorias temáticas (ex: Estudo, Trabalho, Leitura, Código) com identificadores visuais em cores.

### Comportamento
O componente `TagSelector` lista as tags do usuário com suas respectivas cores. O usuário pode selecionar múltiplas tags ou alternar a ativação. Permite criar novas tags fornecendo nome e escolhendo cores da paleta, bem como remover tags existentes. Possui persistência remota no Supabase (`table: tags`) com fallback automático para `localStorage` (`ocean_flow_tags_focus`).

### Entrada
Cliques para seleção/deseleção de tags; input de texto para nova tag; clique para excluir.

### Saída
Array de tags selecionadas repassado ao timer e gravado junto aos registros de ciclo.

### Regras
- Nome da tag não pode ser vazio.
- Cores são alternadas ciclicamente da paleta de 6 tons ocean/teal/purple/pink/gold/orange.
- Fornece tags padrão na primeira utilização (`Estudo`, `Trabalho`, `Leitura`).

### Estados
- Lista regular
- Modo de criação ativo (`isCreating: true`)
- Carregamento (`loading: true`)

### Interface
Exibido abaixo do timer ou no modal de troca de fase.

### Dependências
`TagSelector.tsx`, `supabase/client.ts`, `useAuth.tsx`.

### Arquivos relacionados
- `src/components/TagSelector.tsx`
- `src/components/TagManagement.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-010] Seletor de Tags e Ações de Mergulho

### Status
Ativa

### Objetivo
Registrar anotações de progresso e tarefas realizadas durante o mergulho profundo.

### Comportamento
Durante ou ao final da fase de Mergulho, o usuário pode selecionar tags de ação e preencher um campo de texto (`actions`/`notes`) descrevendo exatamente o que foi executado naquele bloco de foco.

### Entrada
Texto descritivo de ações realizadas e seleção de tags.

### Saída
Campos `tag` e `actions` persistidos na entidade `CycleRecord`.

### Regras
- Os dados são salvos na tabela `cycle_records` vinculados à fase `dive`.

### Estados
- Vazio / Preenchido

### Interface
Modal `PhasePopup.tsx` e componente `DiveTagSelector.tsx`.

### Dependências
`DiveTagSelector.tsx`, `database.ts`.

### Arquivos relacionados
- `src/components/DiveTagSelector.tsx`
- `src/components/PhasePopup.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-011] Seletor de Tags de Respiração e Estado Mental

### Status
Ativa

### Objetivo
Etiquetar o momento de pausa com o estado de recuperação, saúde mental ou hábitos de relaxamento (ex: Alongamento, Água, Respiração Guiada, Descanso Visual).

### Comportamento
Exibe tags com paleta de cores aconchegantes e quentes (`hsl(25, 80%, 55%)` etc.). O usuário seleciona o que realizou durante o intervalo. As seleções alimentam as métricas de bem-estar do dashboard (`BreathAnalytics`). Possui fallback automático para `localStorage` (`ocean_flow_tags_breath`).

### Entrada
Seleção de tags de respiração ou criação de novas tags pelo usuário.

### Saída
Associação das tags de respiração ao ciclo gravado.

### Regras
- Fornece tags padrão (`Alongamento`, `Água`, `Descanso`).
- Salva com tipo `tag_type: 'breath'`.

### Estados
- Lista regular
- Criação de nova tag
- Carregando

### Interface
Modal de conclusão de respiração `PhasePopup.tsx` e `BreathTagSelector.tsx`.

### Dependências
`BreathTagSelector.tsx`, `supabase/client.ts`, `database.ts`.

### Arquivos relacionados
- `src/components/BreathTagSelector.tsx`
- `src/components/BreathAnalytics.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-012] Agrupamento de Tags (Tag Groups)

### Status
Ativa

### Objetivo
Organizar múltiplas tags em projetos ou áreas macro (ex: Faculdade, Trabalho PJ, Vida Pessoal).

### Comportamento
Gerencia a tabela `tag_groups` permitindo atribuir um grupo a uma tag existente (`tags.group_id`). No dashboard, o componente `GroupAnalytics` agrega o total de horas e ciclos dedicados por cada grupo.

### Entrada
Criação de grupos com nome e cor; associação de tags a grupos.

### Saída
Estatísticas agrupadas de tempo e contagem de ciclos por macro-área.

### Regras
- Se uma tag não possui grupo, entra na categoria avulsa.

### Estados
- Grupos configurados / Sem grupos

### Interface
Aba de gerenciamento no `Dashboard.tsx` através de `TagManagement.tsx` e `GroupAnalytics.tsx`.

### Dependências
`database.ts`, `TagManagement.tsx`, `GroupAnalytics.tsx`.

### Arquivos relacionados
- `src/components/TagManagement.tsx`
- `src/components/GroupAnalytics.tsx`
- `src/lib/database.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-013] Avaliação de Ciclo de Foco (Rating 1 a 5 Estrelas)

### Status
Ativa

### Objetivo
Permitir que o usuário avalie sua percepção de foco e qualidade ao concluir um bloco de trabalho.

### Comportamento
Ao término de um ciclo de respiração, o modal `RatingPopup` aparece solicitando uma classificação de 1 a 5 estrelas. Ao selecionar a pontuação, o registro do ciclo é atualizado (`updateCycleRatingAsync`) e persistido.

### Entrada
Clique na estrela correspondente (nota de 1 a 5).

### Saída
Coluna `rating` preenchida na tabela `cycle_records` e no storage local.

### Regras
- O preenchimento é opcional (usuário pode fechar ou pular o modal).
- Notas alimentam os gráficos de satisfação e correlação com música no Dashboard.

### Estados
- Modal aberto
- Avaliação gravada
- Modal dispensado

### Interface
Modal `RatingPopup.tsx` sobreposto à tela inicial.

### Dependências
`RatingPopup.tsx`, `database.ts`, `storage.ts`.

### Arquivos relacionados
- `src/components/RatingPopup.tsx`
- `src/lib/database.ts`
- `src/lib/storage.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-014] Avaliação Diária de Qualidade

### Status
Ativa

### Objetivo
Realizar check-in diário sobre a produtividade global e bem-estar do dia.

### Comportamento
O componente `DailyRatingPrompt` verifica se o usuário já avaliou o dia atual na tabela `daily_ratings`. Se não avaliou e completou ciclos, solicita nota de 1 a 5 com feedback visual diário.

### Entrada
Nota de 1 a 5 estrelas para o dia corrente.

### Saída
Registro na tabela `daily_ratings` vinculando `user_id`, `rating` e `rating_date`.

### Regras
- Só solicita uma avaliação por dia por usuário.

### Estados
- Aberto / Concluído / Fechado

### Interface
Card pop-in no rodapé da página inicial.

### Dependências
`DailyRatingPrompt.tsx`, `supabase/client.ts`.

### Arquivos relacionados
- `src/components/DailyRatingPrompt.tsx`
- `src/pages/Index.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-015] Widget e Modal de Missões Diárias

### Status
Ativa

### Objetivo
Gamificar o dia de trabalho com metas claras de produtividade (ex: completar 4 ciclos, acumular 100 minutos de mergulho, manter foco em tag específica).

### Comportamento
Exibe uma barra de progresso compacta na interface (`MissionsWidget`). Ao clicar, abre o modal `MissionsPopup` com lista detalhada de missões do dia, checklist de tarefas da tabela `tasks` e indicador percentual de conclusão.

### Entrada
Cliques para marcar tarefas como concluídas ou consultar missões.

### Saída
Progresso recalculado e tarefas atualizadas na tabela `tasks`.

### Regras
- Tarefas têm suporte a data de vencimento (`due_date`) e status booleano `completed`.

### Estados
- Widget minimizado
- Modal aberto
- Missões concluídas

### Interface
Canto superior da tela inicial e modal central.

### Dependências
`MissionsWidget.tsx`, `MissionsPopup.tsx`, `database.ts`.

### Arquivos relacionados
- `src/components/MissionsWidget.tsx`
- `src/components/MissionsPopup.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-016] Integração Spotify (PKCE OAuth & Rastreamento de Faixa)

### Status
Ativa

### Objetivo
Conectar a conta Spotify do usuário via fluxo seguro PKCE para rastrear as músicas ouvidas durante os blocos de foco.

### Comportamento
O hook `useSpotify` implementa autenticação OAuth 2.0 com PKCE (Proof Key for Code Exchange) sem expor segredos de cliente. Gera code verifier e challenge via SubtleCrypto. Persiste os tokens em `spotify_connections` no Supabase e mantém uma cópia local por usuário para recuperação. Realiza polling periódico do endpoint `/v1/me/player/currently-playing` para obter faixa, artista, álbum e capa.

### Entrada
Ação de conexão com Spotify, autorização no consent do Spotify e retorno com `code`.

### Saída
Tokens de acesso gravados e objeto `currentTrack` mantido no contexto da aplicação.

### Regras
- Escopos solicitados: `user-read-currently-playing`, `user-read-playback-state`.
- Renovação automática de access token via refresh token antes do vencimento.
- Renovações simultâneas compartilham a mesma solicitação; falhas temporárias mantêm os tokens salvos para nova tentativa.
- Ao desconectar explicitamente ou receber `invalid_grant`, as credenciais locais e remotas são removidas.
- Permite desconectar a qualquer momento.

### Estados
- Desconectado
- Conectando (OAuth redirect)
- Conectado e reproduzindo
- Conectado em pausa

### Interface
Botão de conexão no `NowPlaying.tsx` e `Settings.tsx`.

### Dependências
`useSpotify.tsx`, Spotify Web API, `crypto.subtle`.

### Arquivos relacionados
- `src/hooks/useSpotify.tsx`
- `src/components/NowPlaying.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).
- Persistência local de contingência e renovação resiliente de token adicionadas (STORY-0005).

---

## [MEC-017] Barra de Reprodução Spotify (Now Playing)

### Status
Ativa

### Objetivo
Exibir a música em reprodução no momento do foco, com capa do álbum, nome da faixa, artista e indicador pulsante de ritmo.

### Comportamento
Renderiza um card compacto com estilo glassmorphism iOS exibindo a arte do álbum, título da canção e artista. Ao iniciar um ciclo de Mergulho, esses metadados são capturados e atrelados ao registro do ciclo no banco de dados (`spotify_track_name`, `spotify_artist`, `spotify_album`).

### Entrada
Dados obtidos em tempo real do hook `useSpotify`.

### Saída
Exibição visual da mídia e persistência dos dados musicais junto ao ciclo.

### Regras
- Se nenhuma música estiver tocando ou o Spotify não estiver conectado, o card exibe estado discreto convidando à conexão ou fica recolhido.

### Estados
- Oculto / Desconectado
- Reproduzindo faixa
- Pausado

### Interface
Rodapé da interface principal em `NowPlaying.tsx`.

### Dependências
`NowPlaying.tsx`, `useSpotify.tsx`.

### Arquivos relacionados
- `src/components/NowPlaying.tsx`
- `src/hooks/useSpotify.tsx`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-018] Sincronização em Tempo Real de Sessão (Active Sessions)

### Status
Ativa

### Objetivo
Garantir que a contagem do timer e a fase atual permaneçam perfeitamente sincronizadas entre múltiplas abas do navegador ou múltiplos dispositivos logados.

### Comportamento
O hook `useSessionSync` escuta a tabela `active_sessions` do Supabase via canal Realtime Postgres Changes (`event: *`). Quando uma alteração é feita em outro dispositivo, ela é aplicada localmente considerando a latência e o tempo decorrido desde o timestamp `updated_at`. Possui debounce para envio de atualizações locais (300ms) e fallback automático para `localStorage` quando executando em modo offline ou convidado.

### Entrada
Atualizações de fase, tempo restante, overtime e status de execução.

### Saída
Sincronização imediata entre sessões ativas.

### Regras
- Compara timestamps para ignorar atualizações refletidas pelo próprio dispositivo (buffer de 500ms).
- Em modo local/offline, persiste no item `ocean_flow_active_session` do `localStorage`.

### Estados
- Carregando sessão
- Sincronizado via Realtime
- Sincronizado localmente via localStorage

### Interface
Subjacente a toda a operação do cronômetro.

### Dependências
`useSessionSync.ts`, Supabase Realtime, `database.ts`.

### Arquivos relacionados
- `src/hooks/useSessionSync.ts`
- `src/lib/database.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-019] Dashboard Analítico e Histórico

### Status
Ativa

### Objetivo
Apresentar visão consolidada do desempenho do usuário com gráficos de tempo focado, ciclos completados, evolução diária e histórico recente.

### Comportamento
Página `/dashboard` que consulta o histórico de ciclos (`getCyclesAsync`, `getDailyStatsAsync`, `getTagStatsAsync`) e renderiza gráficos interativos usando a biblioteca `recharts` (BarChart, PieChart, LineChart). Permite filtrar por intervalos de datas e visualizar os últimos 20 ciclos detalhados.

### Entrada
Navegação para a rota `/dashboard` e filtros temporais (7 dias, 30 dias, total).

### Saída
Métricas chave (Total de minutos focados, ciclos finalizados, média diária) e gráficos renderizados.

### Regras
- Cálculos consideram apenas a fase de Mergulho (`dive`) para contabilização de tempo focado real.
- Ciclos contam a partir da finalização da Respiração (`breath`).

### Estados
- Carregando
- Vazio (sem dados registrados)
- Gráficos povoados

### Interface
Rota `/dashboard`, componente `Dashboard.tsx`.

### Dependências
`recharts`, `date-fns`, `database.ts`, `Dashboard.tsx`.

### Arquivos relacionados
- `src/pages/Dashboard.tsx`
- `src/lib/database.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-020] Correlação Música x Produtividade (Music Analytics)

### Status
Ativa

### Objetivo
Analisar quais artistas e faixas musicais estiveram associados às maiores notas de foco e aos maiores tempos de imersão.

### Comportamento
Cruza os dados de `spotify_artist` e `spotify_track_name` com as notas atribuídas (`rating`) e durações de mergulho. Exibe lista ranqueada de artistas com maior tempo de foco e melhores notas médias (`MusicAnalytics.tsx`).

### Entrada
Registros históricos de ciclos com faixas atreladas.

### Saída
Tabela e cards analíticos de artistas e faixas com estatísticas de correlação.

### Regras
- Requer pelo menos 2 ciclos com a mesma faixa para incluir no ranking de melhores faixas.

### Estados
- Sem dados de música / Ranqueamento ativo

### Interface
Seção de música dentro da página `/dashboard`.

### Dependências
`MusicAnalytics.tsx`, `database.ts`.

### Arquivos relacionados
- `src/components/MusicAnalytics.tsx`
- `src/lib/database.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-021] Análise de Padrões Mentais (Breath Analytics)

### Status
Ativa

### Objetivo
Mapear a frequência de tags de respiração e práticas de bem-estar ao longo do tempo.

### Comportamento
O componente `BreathAnalytics` calcula a porcentagem de ocorrência de cada tag de respiração (ex: Alongamento, Respiração, Pausa para café) em relação ao total de pausas realizadas, permitindo identificar hábitos saudáveis e lacunas de recuperação.

### Entrada
Histórico de tags da fase de respiração.

### Saída
Gráfico de barras e distribuição percentual de hábitos de pausa.

### Regras
- Tags separadas por vírgula no mesmo ciclo são contabilizadas individualmente.

### Estados
- Com dados / Sem dados registrados

### Interface
Aba de saúde mental / respiração no `Dashboard.tsx`.

### Dependências
`BreathAnalytics.tsx`, `database.ts`.

### Arquivos relacionados
- `src/components/BreathAnalytics.tsx`
- `src/lib/database.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-022] Resumo Diário Consolidado (Daily Summary)

### Status
Ativa

### Objetivo
Prover uma tela dedicada ao balanço do dia corrente, comparando tempo focado, fases puladas e metas concluídas.

### Comportamento
Página acessível pela rota `/summary`. Apresenta cards resumidos de minutos focados no dia, total de ciclos completos, quantidade de fases que foram puladas antes do tempo e tarefas concluídas da lista de metas.

### Entrada
Navegação para a rota `/summary`.

### Saída
Visão consolidada com gráfico de distribuição do tempo gasto por tag no dia.

### Regras
- O filtro temporal do resumo considera estritamente o início e o fim do dia de hoje (00:00:00 até 23:59:59 da hora local).

### Estados
- Carregando / Exibindo resumo

### Interface
Rota `/summary`, componente `DailySummary.tsx`.

### Dependências
`DailySummary.tsx`, `database.ts`, `useAuth.tsx`.

### Arquivos relacionados
- `src/pages/DailySummary.tsx`
- `src/lib/database.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-023] Configurações de Ciclos e Disparo de Relatório por Email

### Status
Ativa

### Objetivo
Permitir a personalização dos tempos das três fases do Pomodoro e fornecer gatilho para envio manual do resumo diário para o email cadastrado do usuário.

### Comportamento
Página `/settings`:
- Sliders/inputs numéricos para definir minutos de Imersão, Mergulho e Respiração.
- Padrões iniciais de 5 minutos para Imersão, 30 para Mergulho e 10 para Respiração.
- Salva na tabela `pomodoro_settings` com fallback local.
- Botão "Enviar resumo diário por email" que aciona a Supabase Edge Function `daily-email-summary` enviando os dados de produtividade do dia via SMTP.

### Entrada
Valores de tempo em minutos e clique no botão de envio de email.

### Saída
Configurações salvas e notificação toast de sucesso ou erro do envio de email.

### Regras
- Requer credenciais SMTP válidas configuradas no backend Supabase para sucesso do envio de email.
- Tempos devem ser inteiros positivos.

### Estados
- Visualização de configurações
- Enviando email (`sendingEmail: true`)

### Interface
Rota `/settings`, componente `Settings.tsx`.

### Dependências
`Settings.tsx`, `database.ts`, Supabase Functions.

### Arquivos relacionados
- `src/pages/Settings.tsx`
- `supabase/functions/daily-email-summary/index.ts`
- `src/lib/database.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).
- Padrões e migração de configurações antigas alinhados em 5/30/10 minutos (STORY-0005).

---

## [MEC-024] Autenticação e Gestão de Usuário (Supabase Auth + Modo Convidado)

### Status
Ativa

### Objetivo
Controlar o acesso às contas dos usuários com segurança, permitindo login, cadastro, recuperação de senha e um modo convidado local imediato para testes sem fricção.

### Comportamento
Página `/auth`:
- **Login com senha**: Autentica credenciais no Supabase Auth.
- **Cadastro**: Cria conta com email, senha e nome de exibição.
- **Recuperação de Senha**: Dispara email de redefinição via edge function `send-reset-email`.
- **Modo Convidado (Local)**: Permite entrar instantaneamente sem cadastro prévio, gerando um perfil local seguro que armazena todas as configurações, ciclos e tags no `localStorage`.
- **Fallback Automático**: Se o backend Supabase estiver desconectado ou com variáveis não configuradas, a aplicação comuta silenciosamente para o modo local, garantindo funcionamento ininterrupto.

### Entrada
Email, senha e nome do usuário ou clique em "Continuar como Convidado".

### Saída
Sessão estabelecida (`session` e `user`), redirecionamento para a página inicial `/`.

### Regras
- Senhas requerem no mínimo 6 caracteres.
- Formatos de email validados via Zod schema.
- Rotas protegidas (`ProtectedRoute` em `App.tsx`) redirecionam para `/auth` se não houver usuário autenticado.

### Estados
- Modo login (`signin`)
- Modo cadastro (`signup`)
- Modo recuperação de senha (`reset`)
- Carregando submissão

### Interface
Rota `/auth`, componente `Auth.tsx`.

### Dependências
`useAuth.tsx`, `supabase/client.ts`, Zod.

### Arquivos relacionados
- `src/pages/Auth.tsx`
- `src/hooks/useAuth.tsx`
- `src/integrations/supabase/client.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-025] Insights de Produtividade por IA (AI Insights)

### Status
Ativa

### Objetivo
Analisar o histórico recente de ciclos, tags e avaliações do usuário para gerar recomendações personalizadas de foco e descanso via Inteligência Artificial.

### Comportamento
O componente `AIInsightsCard` no Dashboard permite solicitar análise de produtividade. Ele invoca a Edge Function `ai-insights`, que processa o volume de trabalho, taxa de conclusão e ratings para gerar um feedback textual formatado com diagnóstico e sugestões de ajuste nos intervalos e hábitos de foco.

### Entrada
Ação do usuário ao solicitar geração de insight ou carregamento inicial no Dashboard.

### Saída
Card com texto analítico gerado e recomendações práticas.

### Regras
- Depende de chave de API configurada no backend da Edge Function (`ai-insights`).
- Em caso de falha de conexão com a função, exibe mensagem descritiva sem travar o restante do dashboard.

### Estados
- Não solicitado / Carregando análise / Exibindo insights / Erro de comunicação

### Interface
Card na página `/dashboard`.

### Dependências
`AIInsightsCard.tsx`, Supabase Edge Function `ai-insights`.

### Arquivos relacionados
- `src/components/AIInsightsCard.tsx`
- `supabase/functions/ai-insights/index.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).

---

## [MEC-026] Camada de Persistência Híbrida e Resiliência Offline

### Status
Ativa

### Objetivo
Garantir que nenhuma operação do temporizador ou registro de ciclo falhe por problemas de rede ou ausência de conexão com o banco de dados.

### Comportamento
O módulo `database.ts` atua como facade inteligente sobre `supabase/client.ts` e `storage.ts`:
- Toda gravação prioritariamente salva no `localStorage` via `storage.ts`.
- Se o Supabase estiver configurado e o usuário for remoto, replica assincronamente para as tabelas correspondentes.
- Se qualquer requisição remota falhar por timeout ou erro de rede, o retorno dos métodos analíticos recorre imediatamente aos dados do `localStorage`.

### Entrada
Chamadas a `getSettingsAsync`, `saveSettingsAsync`, `saveCycleRecordAsync`, `updateCycleRatingAsync`, `getCyclesAsync`, etc.

### Saída
Resultados imediatos consistentes sem travamento da interface.

### Regras
- Não disparar exceções não tratadas para a camada de componentes visuais.
- Preservar integridade dos timestamps ISO 8601.

### Estados
- Conectado (remoto ativo)
- Desconectado / Fallback ativo

### Interface
Transparente a todas as telas da aplicação.

### Dependências
`database.ts`, `storage.ts`, `supabase/client.ts`.

### Arquivos relacionados
- `src/lib/database.ts`
- `src/lib/storage.ts`
- `src/integrations/supabase/client.ts`

### Histórico
- Registrado na implantação da governança (STORY-0001).
