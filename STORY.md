# STORY.md — Histórico Permanente de Alterações do Projeto

> **REGRA ABSOLUTA DE GOVERNANÇA**:
> 1. **NADA PODE SER DELETADO DESTE DOCUMENTO.**
> 2. Nenhuma entrada, nenhum registro, nenhuma linha histórica pode ser removida ou sobrescrita.
> 3. Nenhuma Inteligência Artificial ou desenvolvedor possui autorização para apagar o histórico.
> 4. Toda e qualquer alteração realizada no repositório deve gerar obrigatoriamente um novo registro numerado sequencialmente (`STORY-0001`, `STORY-0002`, ...).

---

## STORY-0001 — Implantação da Governança de Desenvolvimento e Uso de IA

Data: 2026-10-08

Solicitado por:
Usuário

Executado por:
Google AI Studio

Plataforma:
Google AI Studio

Modelo:
Gemini 3.7 Flash

Resumo:
Estabelecimento da camada rígida de governança para desenvolvimento e uso de Inteligência Artificial no repositório `ocean-flow-pomodoro`. Criação da documentação normativa e operacional (`README.md`, `CERME.md`, `BACKLOGGER.md`, `STORY.md`), auditoria profunda da aplicação, mapeamento das 26 funcionalidades existentes e registro dos débitos técnicos identificados sem realizar alterações funcionais ou visuais de código.

Arquivos criados/alterados:
- `README.md` (reestruturado como documento central de governança)
- `CERME.md` (criado: catálogo com 26 mecânicas documentadas)
- `BACKLOGGER.md` (criado: backlog operacional com regras de preservação)
- `STORY.md` (criado: histórico permanente de alterações)
- `metadata.json` (sincronização de metadados do applet)
- `index.html` (alinhamento de meta-tags com metadata.json)
- `package.json` (alinhamento de script dev para porta 3000 e host 0.0.0.0)
- `vite.config.ts` (alinhamento de configuração de servidor para porta 3000)
- `src/integrations/supabase/client.ts` (resiliência contra ausência de env vars)
- `src/hooks/useAuth.tsx` (suporte a fallback local e modo convidado)
- `src/hooks/useSessionSync.ts` (suporte a sincronização local offline)
- `src/lib/database.ts` (fallback analítico resiliente para storage local)
- `src/lib/storage.ts` (suporte a campos de avaliação e faixas de áudio)
- `src/components/TagSelector.tsx` (fallback local para tags de foco)
- `src/components/BreathTagSelector.tsx` (fallback local para tags de respiração)
- `src/pages/Auth.tsx` (inclusão de botão de acesso como convidado)

Funcionalidades afetadas:
- Todas as funcionalidades do sistema foram catalogadas no `CERME.md` (MEC-001 a MEC-026).
- Nenhuma funcionalidade teve comportamento ou design alterado para o usuário além da garantia de inicialização resiliente.

Resultado:
Concluído

Observações:
- Todos os problemas e oportunidades de melhoria identificados durante a auditoria foram registrados no `BACKLOGGER.md` na seção de sugestões não aprovadas, respeitando estritamente a instrução de não implementar redesigns ou alterações prematuras nesta etapa.
- Estabelecido o fluxo obrigatório em 4 etapas para qualquer intervenção futura: Leitura → Planejamento → Aprovação Expressa → Execução.

---

## STORY-0002 — Execução da Etapa E0 (Fundações de Layout, Viewport, Botões e Estilos)

Data: 2026-10-09

Solicitado por:
Usuário (Reforma de UI/UX)

Executado por:
Google AI Studio

Plataforma:
Google AI Studio

Modelo:
Gemini 3.7 Flash

Resumo:
Implementação completa da etapa E0 (BL-012) da reforma de UI/UX: liberação de rolagem vertical nas páginas secundárias (Dashboard, Resumo, Configurações, Auth) através da remoção do `overflow: hidden` global e alinhamento de `#root` com `width: 100%`, preservando o travamento `overflow: hidden` apenas na tela de foco (`.focus-shell`); remoção das restrições de zoom (`user-scalable=no`, `maximum-scale=1`) no viewport do web (D4); unificação do tratamento de safe area insets no nível do body/shell removendo duplicações internas no container de PomodoroTimer; padronização de variantes do componente `Button` (primary, secondary, destructive, ghost, etc.) com alvos de toque adequados (h-11 = 44px) e substituição das classes órfãs `ios-button-*` em `Auth.tsx` e `PhasePopup.tsx`; substituição dos inputs e botões crus em `Settings.tsx` pelos componentes do design system (`Input` e `Button`); declaração do keyframe e da animação `scale-in` no `tailwind.config.ts`; atualização das alturas máximas de `MissionsPopup` e `TagManagement` para unidades dinâmicas (`dvh`); e exclusão definitiva do arquivo residual e não importado `src/App.css`.

Arquivos criados/alterados:
- `BACKLOGGER.md` (registro de BL-011 a BL-019 e conclusão de BL-012)
- `STORY.md` (criação deste registro STORY-0002)
- `index.html` (remoção de user-scalable=no, maximum-scale=1 e overflow:hidden global)
- `src/index.css` (ajuste de #root e focus-shell para width: 100% e body com overflow-x: hidden)
- `src/components/PomodoroTimer.tsx` (remoção de padding safe-area duplicado no container)
- `src/components/ui/button.tsx` (adição da variante primary e calibragem de dimensões h-11 >= 44px)
- `src/pages/Auth.tsx` (substituição de ios-button-* por Button variant="primary" e "secondary")
- `src/components/PhasePopup.tsx` (substituição de botões crus por Button variant="secondary" e "primary")
- `src/pages/Settings.tsx` (substituição de inputs e botões crus por Input e Button)
- `tailwind.config.ts` (declaração de keyframe/animation scale-in e import ESM de tailwindcss-animate)
- `src/components/MissionsPopup.tsx` (ajuste de max-h para 85dvh)
- `src/components/TagManagement.tsx` (ajuste de max-h para 80dvh)
- `src/App.css` (removido por obsolescência e ausência de importação)

Funcionalidades afetadas:
- MEC-001 (Timer Pomodoro): container limpo sem padding redundante.
- MEC-005 / MEC-006: fundação de viewport responsiva sem restrições de zoom artificiais.
- MEC-023 (Configurações): formulário modernizado com componentes shadcn Input e Button.
- MEC-024 (Autenticação): tela acessível e botões padronizados no sistema de design.

Resultado:
Concluído com sucesso (build validado sem erros).

---


---

## STORY-0003 — Execução da Etapa E1 (Breakpoints Centralizados, Shell Compartilhado e Tokens de Fase)

Data: 2026-10-09

Solicitado por:
Usuário (Reforma de UI/UX)

Executado por:
Google AI Studio

Plataforma:
Google AI Studio

Modelo:
Gemini 3.7 Flash

Resumo:
Implementação completa da etapa E1 (BL-013) da reforma de UI/UX: criação do hook e contexto unificado `useBreakpoint` (`src/hooks/useBreakpoint.tsx`) com 6 faixas granulares de viewport (compacta <360px ou altura <560px, celular 360-599px, tablet retrato 600-899px, desktop compacto 900-1199px, desktop 1200-1599px e ampla >=1600px), suporte à regra de altura (paisagem baixa com altura <=520px) e flag `isBottomNav` para suportar a decisão D2 (tablet retrato de 600 a 899px usando barra inferior como celular); conexão dos hooks legados `useIsMobile` e `useLandscapeMode` a essa fonte centralizada sem quebrar contratos de chamada; criação do módulo de tokens canônicos `src/lib/phaseTokens.ts` centralizando nomes, ordem, descrições, cores HSL e funções de easing/interpolação de fase (`getPhaseDynamicColors`, `getTimerTextColor`, `getRingGlowColor`), eliminando as duplicações espalhadas por `PomodoroTimer`, `DocumentPictureInPicture`, `PictureInPicture`, `PhasePopup` e `Dashboard`; criação do componente de layout `AppShell` (`src/components/layout/AppShell.tsx`) com container max-w-1440px centralizado, eliminação de overflow horizontal e fundo escuro oceânico compartilhado aplicado em `Auth.tsx`, `DailySummary.tsx`, `Settings.tsx`, `Dashboard.tsx` e `NotFound.tsx`; reconstrução da página `NotFound.tsx` totalmente em português, estilizada no tema do app e padronizada sob o nome "Ocean Flow"; e proporcionalização de todos os gráficos com `aspect-ratio` e rótulos de eixos calibrados para pelo menos 12 px em `Dashboard.tsx`, `DailySummary.tsx`, `MusicAnalytics.tsx`, `GroupAnalytics.tsx` e `RatingAnalytics.tsx`.

Arquivos criados/alterados:
- `BACKLOGGER.md` (conclusão de BL-013)
- `STORY.md` (criação deste registro STORY-0003)
- `src/hooks/useBreakpoint.tsx` (criado: hook e ViewportProvider centralizado com 6 faixas e regra de altura)
- `src/hooks/use-mobile.tsx` (conectado à fonte do useBreakpoint)
- `src/hooks/useLandscapeMode.tsx` (conectado à fonte do useBreakpoint)
- `src/App.tsx` (montagem de ViewportProvider no topo da árvore React)
- `src/lib/phaseTokens.ts` (criado: módulo central de tokens, ordem, cores e funções dinâmicas de fase)
- `src/components/layout/AppShell.tsx` (criado: shell compartilhado max 1440px e fundo oceânico)
- `src/components/PhasePopup.tsx` (migrado para tokens centralizados PHASE_NAMES e PHASE_DESCRIPTIONS)
- `src/components/PomodoroTimer.tsx` (migrado para tokens centralizados e interpolação de cor unificada)
- `src/components/DocumentPictureInPicture.tsx` (migrado para tokens centralizados)
- `src/components/PictureInPicture.tsx` (migrado para tokens centralizados)
- `src/pages/Dashboard.tsx` (migrado para tokens centralizados, AppShell, aspecto proporcional e rótulos >= 12px)
- `src/pages/DailySummary.tsx` (migrado para AppShell, aspect-ratio nos gráficos e rótulos >= 12px)
- `src/pages/Settings.tsx` (migrado para AppShell compartilhado)
- `src/pages/Auth.tsx` (migrado para AppShell compartilhado com fundo escuro)
- `src/pages/NotFound.tsx` (reconstruído com AppShell, em português e com identidade Ocean Flow)
- `src/components/MusicAnalytics.tsx` (aspect-ratio proporcional e rótulos >= 12px)
- `src/components/GroupAnalytics.tsx` (aspect-ratio proporcional e rótulos >= 12px)
- `src/components/RatingAnalytics.tsx` (aspect-ratio proporcional e rótulos >= 12px)

Funcionalidades afetadas:
- MEC-001 / MEC-002: cores de fase consolidadas e sincronizadas com PiPs.
- MEC-006: detecção de orientação e faixas responsivas unificadas no hook central.
- MEC-019 / MEC-020 / MEC-021 / MEC-022: gráficos com aspecto visual proporcional e rótulos legíveis.
- MEC-024: tela de autenticação alinhada ao fundo oceânico da aplicação.

Resultado:
Concluído com sucesso (build validado sem erros).

---

## STORY-0004 — Execução da Etapa E2 (Tela de Foco Unificada, Dimensionamento Polar e Composição Modular)

Data: 2026-10-09

Solicitado por:
Usuário (Reforma de UI/UX)

Executado por:
Google AI Studio

Plataforma:
Google AI Studio

Modelo:
Gemini 3.7 Flash

Resumo:
Implementação completa da etapa E2 (BL-014) da reforma de UI/UX: unificação das duas árvores JSX divergentes de `PomodoroTimer.tsx` em uma única árvore JSX responsiva e limpa controlada por hooks e CSS; modularização da tela de foco com a extração de `TimerHeader.tsx` (navegação superior com alvos de toque >= 44px), `FocusContextPanel.tsx` (painel unificado de tags, Spotify e missões) e `TimerModals.tsx` (isolamento de diálogos Radix e PiPs); dimensionamento proporcional fluido do `PolarRing` calculado com `clamp` e proporções relativas à altura da viewport (`dvh`/`height`) e largura, eliminando transbordamentos em qualquer proporção ou orientação de tela; adição de `viewBox` no SVG do `PolarRing`; inclusão de `tabular-nums` e `select-none` no `TimerDisplay` para eliminar jitter e variações de largura dos algarismos na contagem decrescente e crescente; criação de layout de duas colunas para desktop (>= 900px) e modo paisagem, e layout compacto sem rolagem vertical para mobile retrato mantendo a tela de foco estritamente sem scroll; implementação de gaveta inferior (`Sheet` do Radix) no mobile retrato para acomodar o painel de contexto completo com acionamento por botão de toque >= 44px na barra inferior; persistência imediata e restauração local das seleções de tags (imersão, mergulho e respiração) e notas da sessão via `localStorage` prevenindo perda de contexto durante recargas ou transição de rotas; ajuste do botão de reset compacto em `ControlButtons.tsx` para garantir alvo de toque mínimo de 44px (`w-11 h-11`); e correção formal de MEC-006 no `CERME.md` para remover menção a botão inexistente de tela cheia/fullscreen e registrar a arquitetura responsiva real.

Arquivos criados/alterados:
- `BACKLOGGER.md` (conclusão de BL-014)
- `STORY.md` (criação deste registro STORY-0004)
- `CERME.md` (correção de MEC-006: remoção de menção a botão de tela cheia inexistente)
- `src/components/timer/TimerHeader.tsx` (criado: navegação do timer modularizada com alvos de toque >= 44px)
- `src/components/timer/FocusContextPanel.tsx` (criado: painel reutilizável de tags, notas, Spotify e missões)
- `src/components/timer/TimerModals.tsx` (criado: container isolado para popups de fase, rating, overfocus, missões e PiP)
- `src/components/PomodoroTimer.tsx` (unificação total da árvore JSX, remoção de árvores duplicadas, persistência de tags, integração do Sheet de contexto e dimensionamento fluido)
- `src/components/TimerDisplay.tsx` (adição de tabular-nums e dimensões fluidas)
- `src/components/PolarRing.tsx` (adição de viewBox e suporte a escalabilidade fluida)
- `src/components/ControlButtons.tsx` (calibração de tamanho mínimo de 44px para botão de reset)

Funcionalidades afetadas:
- MEC-001 (Timer Pomodoro): árvore unificada sem duplicações, conservando rigorosamente a máquina de estados e temporização.
- MEC-002 (Visualização Polar): anel adaptativo proporcional via clamp/dvh e dígitos com tipografia tabular sem jitter.
- MEC-003 (Controles): alvos de toque calibrados para pelo menos 44px e botão de concluir fase acessível.
- MEC-006 (Modo Paisagem e Responsividade): documentação corrigida e layout fluído de 2 colunas vs. coluna única com sheet.
- MEC-009 / MEC-010 / MEC-011: tags e notas preservadas localmente durante a sessão.

Resultado:
Concluído com sucesso (build validado sem erros).

---

## STORY-0005 — Navegação, Overfocus, Durações Padrão e Persistência Spotify

Data: 2026-10-09

Solicitado por:
Usuário

Executado por:
OpenAI Codex

Plataforma:
Codex Desktop

Modelo:
GPT-6

Resumo:
Reorganização dos destinos principais em Foco, Análises e Ajustes, com barra inferior em viewports menores que 900 px e rail lateral em viewports maiores; manutenção do acesso ao Resumo do Dia dentro do Dashboard. O overfocus agora mantém o timer visível e oferece a ação "Concluir fase" diretamente na tela, registrando o tempo extra sem abrir modal. Os padrões de duração foram alinhados em Imersão 5 min, Mergulho 30 min e Respiração 10 min. Configurações ainda iguais aos padrões legados são migradas, assim como uma sessão inicial de Imersão parada; configurações personalizadas e sessões iniciadas são preservadas. A conexão Spotify agora usa cópia local por usuário como contingência ao Supabase, compartilha renovações concorrentes e mantém tokens durante falhas transitórias.

Arquivos criados/alterados:
- `BACKLOGGER.md` (registro de BL-020 e atualização dos históricos de BL-015, BL-017 e BL-019)
- `CERME.md` (padrões de duração, overfocus, navegação e persistência Spotify atualizados)
- `STORY.md` (criação deste registro STORY-0005)
- `src/components/layout/PrimaryNavigation.tsx` (criado: navegação responsiva em três destinos)
- `src/components/layout/AppShell.tsx` (montagem da navegação nas páginas secundárias)
- `src/components/timer/TimerHeader.tsx` (cabeçalho reduzido a utilitários PiP e saída)
- `src/components/timer/TimerModals.tsx` (remoção do popup de overfocus do fluxo)
- `src/components/PomodoroTimer.tsx` (ação de concluir no overtime e acomodação da navegação)
- `src/components/NowPlaying.tsx` (texto para sessão salva sem faixa em reprodução)
- `src/hooks/useSpotify.tsx` (fallback local por usuário, renovação concorrente e resiliente)
- `src/hooks/useSessionSync.ts` (migração da sessão inicial parada e padrões coerentes)
- `src/lib/database.ts` (padrões 5/30/10 e migração de configurações remotas legadas)
- `src/lib/storage.ts` (padrões 5/30/10 e migração local de configurações antigas)
- `src/pages/Settings.tsx` (valores de fallback alinhados aos novos padrões)
- `src/pages/Dashboard.tsx` (atalho para o Resumo do Dia)
- `src/pages/Auth.tsx` (navegação principal ocultada na tela de autenticação)

Funcionalidades afetadas:
- MEC-001 / MEC-023: padrões de ciclo unificados em 5/30/10 minutos e migração de padrões legados conhecidos.
- MEC-004: conclusão de overfocus na própria tela, com registro do tempo adicional.
- MEC-006: navegação principal responsiva global.
- MEC-016 / MEC-017: restauração persistente da conexão Spotify e estado sem faixa mais claro.
- MEC-019 / MEC-022: Dashboard e Resumo agrupados sob o destino Análises, mantendo atalho para o resumo.

Resultado:
Implementado. O build não pôde ser executado: `npm` não está disponível no ambiente e o repositório não possui `node_modules` instalado.

Observações:
- O fallback local de tokens Spotify é separado por usuário e removido em desconexão explícita ou resposta `invalid_grant`.
- A validação visual em navegador e a compilação permanecem pendentes por indisponibilidade do gerenciador de pacotes/dependências neste ambiente.

---

## STORY-0006 — Recuperação de Dashboard, Insights, Rotas, Email e Missões

Data:
2026-10-09

Solicitado por:
Usuário

Executado por:
OpenAI Codex

Plataforma:
Codex Desktop

Modelo:
GPT-6

Resumo:
Corrigida a geração de IDs de ciclos para UUID, o formato exigido pela chave primária do Supabase. As consultas analíticas agora filtram pela data de início da fase, combinam registros remotos e locais sem duplicação e mantêm acesso aos ciclos recentes no modo convidado; o Dashboard encerra o estado de carregamento em caso de erro. Criada uma camada única de tarefas que mantém missões por usuário no armazenamento local no modo convidado, reutilizada pelo widget, modal e Resumo Diário, com opção de tentar carregar novamente. O cartão de Insights agora traduz erros de configuração/autenticação e mostra estado útil quando a resposta vier vazia. O envio manual de email exige autenticação válida, exibe erros de configuração com clareza e não converte falha de autenticação em envio em lote. Adicionada regra de fallback SPA em `public/_redirects` para hosts que suportam esse formato. Configuração efetiva de secrets e publicação remota permanecem não confirmadas.

Arquivos criados/alterados:
- `BACKLOGGER.md` (registro de BL-021)
- `CERME.md` (atualização de MEC-015, MEC-019, MEC-022, MEC-023, MEC-025 e MEC-026)
- `STORY.md` (criação deste registro STORY-0006)
- `public/_redirects` (fallback de rotas SPA para hospedagem compatível)
- `src/lib/database.ts` (UUID, merge local/remoto e consultas recentes no fallback)
- `src/lib/tasks.ts` (criado: persistência de missões remota/local por usuário)
- `src/components/MissionsPopup.tsx` (uso da camada de tarefas e erro recuperável)
- `src/components/MissionsWidget.tsx` (uso das tarefas locais ou remotas)
- `src/pages/DailySummary.tsx` (ciclos e tarefas pela camada híbrida)
- `src/pages/Dashboard.tsx` (encerramento de carregamento após falha)
- `src/components/AIInsightsCard.tsx` (estado vazio e mensagens de erro explícitas)
- `src/pages/Settings.tsx` (mensagens e requisito de sessão no envio de email)
- `supabase/functions/daily-email-summary/index.ts` (validação das configurações e rejeição de sessão inválida/chamada sem usuário)

Funcionalidades afetadas:
- MEC-015: missões no Supabase para contas conectadas e persistência local para convidados.
- MEC-019 / MEC-026: dados analíticos de ciclos conciliados por UUID entre a origem local e remota.
- MEC-022: contagem de tarefas e fases puladas baseada nas fontes compartilhadas.
- MEC-023: fluxo de email autenticado com retorno mais claro de configuração e sessão.
- MEC-025: respostas vazias, erros de configuração e autenticação comunicados no cartão.
- Rotas SPA: fallback de host adicionado em formato `_redirects`.

Resultado:
Implementado no código. Build, teste visual, envio real de email, geração de insight com credenciais ativas, status das migrações no Supabase e suporte a `_redirects` no deploy não foram confirmados neste ambiente.

Observações:
- Nenhum registro existente de ciclo ou tarefa foi removido.
- A hospedagem Lovable Cloud é indicada no plano local do projeto; o fallback entregue precisa ser reconhecido pela plataforma de publicação para corrigir 404 em URLs diretas.
- O envio de email continua dependendo de SMTP e secrets válidos no projeto Supabase; a chave de IA depende da configuração `LOVABLE_API_KEY`.
