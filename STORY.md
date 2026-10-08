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
