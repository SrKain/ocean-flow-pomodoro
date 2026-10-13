# Ocean Flow — plano de evolução imersiva

## Estado atual confirmado

- A Home já usa um relógio baseado em timestamps e recalcula o tempo localmente, mas a implementação está concentrada em um componente muito grande.
- A consulta atual confirmou que o banco já possui os timestamps do timer, `timer_status`, `revision` e `auto_advance`; não será necessário recriar essas colunas. O erro atual de TypeScript é a referência a `NodeJS.Timeout` no código do navegador.
- A edição rápida de duração, confirmação de pulo, reset, contagem 3–2–1 e modo overfocus já têm uma base reaproveitável.
- O fundo escuro dinâmico, o anel polar, o layout paisagem e os dois modos de PIP existem, mas repetem regras visuais e usam muitos valores fora do design system.
- O Spotify hoje lê apenas a faixa atual. Não há escopos nem comandos para play/pause, anterior, próxima, dispositivo ou fila.
- Dashboard, resumo diário e configurações funcionam como telas separadas, mas ainda têm hierarquia fragmentada e não cobrem toda a revisão pedida.

## Prioridade antes de continuar — adequar o banco ao aplicativo atual

Esta etapa vem antes do redesign e fica limitada ao que o aplicativo já oferece, sem criar estruturas para funcionalidades futuras.

- Conferir os campos lidos e gravados por timer/sincronização, configurações, ciclos, tags/grupos, missões, avaliações, Spotify e resumos por email contra o banco ativo.
- Preservar as tabelas existentes: `active_sessions`, `pomodoro_settings`, `cycle_records`, `cycle_tags`, `tags`, `tag_groups`, `tasks`, `daily_ratings`, `spotify_connections` e `profiles`.
- Verificar dados reais, duplicidades, vínculos entre ciclos e tags, valores inválidos e registros sem proprietário antes de propor correções; não deduzir problemas apenas da estrutura.
- A consulta atual confirmou RLS habilitada nas tabelas e acesso de leitura/gravação para usuários autenticados. Revisar também as políticas e o isolamento entre contas, sem ampliar acesso público.
- Revisar índices e unicidade necessários aos fluxos atuais. Já existem unicidade de sessão por usuário, conexão Spotify por usuário, avaliação por usuário/dia e vínculo ciclo/tag; verificar duplicidades em configurações antes de acrescentar uma restrição.
- Aplicar somente migrações realmente necessárias, preservando dados e sem reaplicar migrações de colunas que já existem.
- Atualizar os tipos gerados pelo fluxo gerenciado e corrigir apenas os pontos de leitura/gravação incompatíveis, incluindo o erro de temporizador do navegador.
- Validar com uma conta autenticada: salvar/recuperar configurações e timer, registrar ciclo, tags, missão e avaliação, e confirmar os dados nos relatórios. Spotify e email serão verificados sem expor credenciais nem disparar mensagens em massa.
- Entregar um resumo do que foi alterado no banco e do que não exigiu alteração; então retomar as fases abaixo.

## Fase 1 — relógio confiável e estados

- Reutilizar as colunas de timestamps e `auto_advance` já presentes, preservando os registros atuais, políticas e permissões existentes.
- Atualizar os tipos do banco pelo fluxo gerenciado e eliminar os erros atuais de TypeScript.
- Extrair do componente principal um controlador de timer com estados explícitos: `idle`, `running`, `paused`, `transition`, `overtime` e `completed`.
- Manter ticks visuais somente no navegador e persistir apenas início, pausa, retomada, duração, fase, conclusão, pulo e overfocus.
- Reconciliar o relógio por `end_at` ao abrir, voltar do background, trocar de dispositivo ou receber atualização em tempo real.
- Corrigir continuidade de registros, início real da fase e ciclo concluído sem duplicar salvamentos.
- Completar os estados pausado e concluído: continuar, ajustar duração, encerrar sessão e iniciar próxima fase.
- Manter confirmação de pulo, reset contextual e avanço automático 3–2–1.
- Criar testes pequenos para cálculo por timestamp, pausa/retomada, reconciliação, transição e overfocus.

## Fase 2 — Home imersiva mobile-first

- Reorganizar a Home full-bleed em torno do timer, usando `100dvh`, largura total e safe areas sem espaços globais.
- Tornar fase, anel, relógio, progresso e Play/Pause a hierarquia dominante.
- Durante a execução, esconder tags, missões e ações secundárias; manter apenas timer, fase, progresso, pausa e Spotify compacto.
- No estado parado ou pausado, revelar edição de duração, tags/contexto e ações adicionais sem competir com o relógio.
- No modo paisagem, manter timer à esquerda e contexto à direita; criar composições próprias para tablet e desktop, sem apenas ampliar o mobile.
- Centralizar a interpolação escura das fases e reutilizá-la na Home e no PIP.
- Refinar o PolarRing com tamanho responsivo, progresso suave, glow circular sem quinas e estados visuais de pausa, conclusão e overfocus.
- Consolidar tokens semânticos de superfície, glass, glow e fase; substituir cores e estilos inline onde o tema já oferece uma função equivalente.
- Respeitar contraste, áreas de toque, teclado e redução de movimento.

## Fase 3 — Spotify complementar ao foco

- Preservar a conexão individual existente e tornar o callback e os estados de erro visíveis e recuperáveis.
- Evoluir “Ouvindo agora” com capa, faixa, artista, álbum, progresso local entre consultas e link da faixa no Spotify.
- Adicionar controles oficiais somente quando suportados: play/pause, anterior e próxima, com os escopos necessários e tratamento de conta/dispositivo indisponível.
- Exibir o dispositivo atual de forma discreta. Fila e histórico recente ficam em apresentação secundária, sem transformar a Home em player.
- Manter registro de música por ciclo e corrigir a associação entre avaliação do ciclo e música de foco para as análises.

## Fase 4 — Dashboard e Daily Review

- Reestruturar o Dashboard para responder primeiro: tempo focado, ciclos concluídos, taxa de conclusão e evolução no período.
- Agrupar depois as decisões por tag, grupo, música e qualidade, reduzindo gráficos repetidos.
- Manter edição/mescla retroativa de tags e as análises de Respiração já existentes.
- Expandir música × foco com ciclos, conclusão, tempo e qualidade por música/artista usando os dados preservados.
- Transformar `/summary` em Daily Review: foco, ciclos, skips, missões, melhor período, principais tags, música, avaliação e comparação simples com o período anterior quando houver dados.
- Padronizar agregações por data local para não deslocar atividades entre dias.

## Fase 5 — Configurações organizadas

- Reorganizar em Timer, Spotify, Notificações, Aparência e Dados.
- Incluir durações, avanço automático, comportamento ao finalizar e notificações na seção Timer.
- Centralizar conexão/desconexão e preferências do Spotify na seção própria.
- Adicionar intensidade de glow e modo OLED sem quebrar o tema escuro obrigatório.
- Manter envio de resumo por email como ação secundária em Dados.

## Fase 6 — PIP, notificações e validação final

- Fazer o PIP reutilizar as mesmas cores, progresso e estados do timer principal.
- Manter PIP minimalista: timer, fase, play/pause, skip e faixa atual.
- Preservar Document Picture-in-Picture quando disponível e o fallback flutuante no navegador; validar a limitação real por plataforma.
- Solicitar notificações a partir de uma ação do usuário, em vez de automaticamente ao abrir, e comunicar passagem de fase/ciclo/overfocus.
- Revisar foco de teclado, nomes acessíveis, contraste, estados não dependentes só de cor e `prefers-reduced-motion`.
- Validar 320, 360, 390, 430, 768, 1024, 1280, 1440 e 1920 px, portrait e landscape.
- Exercitar refresh, background, pausa/retomada, sincronização entre duas sessões, transições, Spotify desconectado/sem reprodução, overfocus, PIP e persistência.
- Finalizar sem erros de build, TypeScript, lint, console ou runtime.

## Detalhes técnicos

- Não apagar tabelas nem registros; qualquer mudança de banco será aditiva e idempotente.
- Não usar o banco como tick por segundo; `end_at` e timestamps continuam como fonte de recuperação e sincronização.
- Separar cálculo de cores/fases, controlador do timer, persistência e apresentação para evitar novas regras duplicadas.
- Reutilizar React, TypeScript, Vite, Tailwind, Radix/shadcn, Lovable Cloud e Capacitor, sem nova biblioteca salvo necessidade comprovada.
- Implementar e validar fase a fase, mantendo a aplicação utilizável ao final de cada etapa.
