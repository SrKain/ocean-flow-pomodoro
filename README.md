# Pomodoro Oceânico (`ocean-flow-pomodoro`)

> **DOCUMENTO CENTRAL DE GOVERNANÇA DO REPOSITÓRIO**
>
> **AVISO OBRIGATÓRIO PARA INTELIGÊNCIA ARTIFICIAL E DESENVOLVEDORES**:
> Qualquer IA ou desenvolvedor que atuar neste repositório DEVE LER OBRIGATORIAMENTE este `README.md`, o `CERME.md`, o `BACKLOGGER.md` e o `STORY.md` antes de executar qualquer modificação no código.

---

## 1. Identificação do Projeto

- **Nome**: Pomodoro Oceânico (`ocean-flow-pomodoro`)
- **Objetivo**: Aumentar o foco e o bem-estar através de ciclos de produtividade ritmados em três fases marítimas contínuas (Imersão, Mergulho e Respiração), correlacionando trilhas sonoras e hábitos de pausa ao rendimento mental.
- **Descrição**: Aplicação web SPA de Pomodoro com estética aquática bioluminescente, timer polar animado, sincronização em tempo real entre abas e dispositivos, modo Picture-in-Picture nativo, integração com Spotify para rastreamento de faixas durante o foco, avaliação de qualidade de sessão e painéis analíticos detalhados.
- **Stack Principal**:
  - **Runtime & Build**: Node.js 22, Vite 5, TypeScript 5.8
  - **Frontend**: React 18, Tailwind CSS 3.4, Radix UI / shadcn-ui, Lucide Icons, Recharts
  - **Backend & Dados**: Supabase (PostgreSQL, Realtime, Edge Functions, Auth) com camada de resiliência e fallback offline em `localStorage`
  - **Integrações Externas**: Spotify Web API (OAuth PKCE), Screen Wake Lock API, Document Picture-in-Picture API, Web Notifications API

---

## 2. Arquitetura Documental

O repositório adota uma separação rigorosa de responsabilidades documentais:

```text
README.md
│   └── Regras e Governança do Projeto
│
├── CERME.md
│   └── Catálogo de Especificação e Registro de Mecânicas (O que o sistema faz)
│
├── BACKLOGGER.md
│   └── Registro Operacional de Tarefas e Backlog (O que precisa ser feito / foi feito)
│
└── STORY.md
    └── Histórico Permanente de Alterações (O que aconteceu no projeto)
```

- **README.md** = **Regras** (como trabalhar no projeto)
- **CERME.md** = **Comportamento do Produto** (fonte da verdade das funcionalidades)
- **BACKLOGGER.md** = **Trabalho** (tarefas planejadas, ativas e débitos técnicos)
- **STORY.md** = **Histórico** (log imutável de todas as intervenções executadas)

---

## 3. Regra Fundamental: Fluxo Obrigatório em 4 Etapas

Nenhuma alteração pode ser executada sem obedecer estritamente às quatro etapas a seguir:

```text
[ ETAPA 1: LEITURA ] ───> [ ETAPA 2: PLANEJAMENTO ] ───> [ ETAPA 3: APROVAÇÃO ] ───> [ ETAPA 4: EXECUÇÃO ]
```

### ETAPA 1 — LEITURA
Antes de alterar qualquer arquivo, a IA deve obrigatoriamente:
1. Ler este `README.md`;
2. Localizar e ler o `CERME.md`;
3. Localizar e ler o `BACKLOGGER.md`;
4. Localizar e ler o `STORY.md`;
5. Analisar a estrutura atual do projeto;
6. Entender as principais funcionalidades existentes;
7. Identificar os arquivos relacionados à solicitação recebida;
8. Verificar se já existe documentação relacionada à funcionalidade que será alterada.

> **A IA não pode começar a implementar imediatamente após receber uma solicitação. Ela deve primeiro entender o contexto existente.**

### ETAPA 2 — PLANEJAMENTO
Após a leitura, a IA deve apresentar ao usuário um plano explícito e transparente da alteração contendo:
- O que será alterado;
- Por que será alterado;
- Quais arquivos provavelmente serão alterados;
- Quais funcionalidades serão afetadas;
- Quais novas funcionalidades serão criadas;
- Quais funcionalidades existentes serão modificadas;
- Possíveis impactos e efeitos colaterais;
- Riscos identificados;
- Documentação que será atualizada;
- Registro que será criado no `STORY.md`;
- Tarefas que serão adicionadas ou atualizadas no `BACKLOGGER.md`.

### ETAPA 3 — APROVAÇÃO
**A IA NÃO PODE EXECUTAR A ALTERAÇÃO SEM APROVAÇÃO EXPRESSA DO USUÁRIO.**

Frases vagas ou ambíguas como:
- *"pode seguir"*
- *"acho bom"*
- *"faz aí"*
- *"beleza"*
- *"ok"*

somente devem ser consideradas aprovação quando estiver absolutamente claro que o usuário está aprovando o plano específico apresentado.
**Na ausência de aprovação clara, a IA deve permanecer em planejamento e aguardar confirmação explícita.**

### ETAPA 4 — EXECUÇÃO
Somente depois de receber aprovação expressa:
1. Executar a alteração no código;
2. Testar e validar (ex: executar compilação/testes);
3. Atualizar a documentação correspondente;
4. Atualizar o `BACKLOGGER.md`;
5. Registrar a alteração no `STORY.md`;
6. Atualizar o `CERME.md` caso alguma funcionalidade tenha sido criada, alterada ou descontinuada;
7. Informar o resultado ao usuário com clareza e síntese.

---

## 4. Regra de Ouro da Rastreabilidade

Toda alteração no projeto precisa possuir rastreabilidade completa. Nenhuma alteração deve existir apenas no código.
Sempre deve ser possível responder:

> - **O que** foi alterado?
> - **Por que** foi alterado?
> - **Quem** solicitou?
> - **Qual IA** executou?
> - **Qual modelo** foi utilizado?
> - **Qual plataforma** foi utilizada?
> - **Quais arquivos** foram alterados?
> - **Quais funcionalidades** foram afetadas?
> - **Qual foi o resultado**?
> - **Quando** isso aconteceu?

---

## 5. Regra de Preservação e Não Remoção

Nenhuma funcionalidade existente deve ser removida ou modificada sem que isso esteja explicitamente descrito no plano apresentado e aprovado pelo usuário.
A IA **nunca** deve assumir que uma alteração ou exclusão é "óbvia" ou "desnecessária".
O escopo de código já desenvolvido representa esforço e valor acumulado do produto e deve ser protegido contra regressões e deleções acidentais.

---

## 6. Regra Contra Alucinação Documental

A IA nunca deve inventar:
- Funcionalidades que não existem no código;
- Regras de negócio fictícias;
- Arquivos ou caminhos inexistentes;
- Integrações não implementadas;
- Decisões ou históricos não ocorridos.

Se algo não puder ser confirmado no código-fonte ou no histórico documental, registrar explicitamente como `Não identificado` ou `Não confirmado`.

---

## 7. Proteção Absoluta do Histórico

Os documentos `STORY.md` e `BACKLOGGER.md` são patrimônios históricos do projeto:
- **NADA PODE SER DELETADO DELES.**
- "Limpar o documento" **não** autoriza apagar histórico.
- "Organizar o documento" **não** autoriza remover registros antigos.
- "Simplificar o documento" **não** autoriza resumir ou omitir eventos passados.
- Tarefas descontinuadas ou canceladas devem permanecer no `BACKLOGGER.md` com status atualizado e motivo da descontinuação.

---

## 8. Execução e Desenvolvimento Local

### Pré-requisitos
- Node.js 22+
- npm (gerenciador de pacotes oficial)

### Comandos de Desenvolvimento
```bash
# Instalação de dependências
npm install

# Execução do servidor de desenvolvimento (Porta 3000, Host 0.0.0.0)
npm run dev

# Validação e compilação de build
npm run build

# Verificação estática (linter)
npm run lint
```
