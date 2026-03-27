# Documentação de Melhorias em Projeto Existente

## Informações Básicas
### Nome do projeto Original 
`Crazy Views`

### Nome da Iniciativa de Melhorias
`Crazy Views 2.0`

### Equipe de Melhorias
Nome | GitHub | Papel Principal
Jessica Crevelari | http://github.com/CrevelariJessica | Desenvolvimento, Arquitetura e Documentação

## Repositórios
- Projeto Original: (https://github.com/CrevelariJessica/Crazy_Views)
- Novo Repositório: (https://github.com/CrevelariJessica/CrazyViews_2)

### 1. Descrição do Projeto Original

#### Propósito
O Crazy Views é um sistema web para gerenciamento e leitura de HQs digitais (CBR, CBZ, PDF e imagens), permitindo organizar títulos e edições, visualizar páginas em um leitor integrado e gerenciar favoritos.

#### Origem do Projeto
- [X] Projeto de outra disciplina: PROJETO DE EXTENSÃO EM DESENVOLVIMENTO DE APLICAÇÕES MULTIPLATAFORMA

**Detalhes:**
- Quando foi criado: Setembro/2025
- Contexto: Criado para por em pratica conhecimentos de banco de dados mysql, lógica de programação e funcionalidades de desenvolvimento web envolvendo html, php, javascript e css.
- Desenvolvedor original: Jessica Rosa da Cruz Crevelari
- Status atual: Em manutenção e evolução

2. Funcionalidades Existentes

#### Funcionalidades Implementadas
- ✅ **Upload e gerenciamento de HQs** em múltiplos formatos (CBR, CBZ, PDF e imagens)
- ✅ **Extração automática de páginas** de arquivos ZIP, RAR e PDF
- ✅ **Leitor de HQ integrado** com modo vertical ou página a página e controle de zoom
- ✅ **Sistema de favoritos e filtros avançados** para navegação entre títulos
- ✅ **Modo escuro e modo claro persistente**
- ✅ **Dashboard com estatísticas do sistema**
- ✅ **Banco de dados automatizado com Docker**

### 3. Stack Tecnológica Original

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Frontend | HTML, JavaScript, SCSS | - |
| Backend | PHP | 8.x |
| Banco de Dados | MySQL/MariaDB | - |
| Infraestrutura | Docker / Docker Compose | - |

### 4. Arquitetura Atual
Browser
   |
   ▼
Frontend (HTML + JS + CSS)
   |
   ▼
Backend (PHP)
   |
   ▼
Banco de Dados (MySQL)

**Descrição dos componentes**

- **Frontend:** Interface de navegação, leitura de HQ e gerenciamento de títulos.
- **Backend:** Processamento de uploads, extração de arquivos e lógica do sistema.
- **Banco de dados:** Armazena informações de títulos, edições, páginas e favoritos.

## 5. Limitações
### Limitação 1: Ausência de suporte multiusuário
Categoria: Funcional

Descrição:
O sistema foi projetado para uso de um único usuário administrador, não possuindo autenticação ou gerenciamento de múltiplas contas.

Impacto:
Limita o uso do sistema em ambientes compartilhados ou em servidores públicos.

Frequência: Média

### Limitação 2: Organização manual da biblioteca
Categoria: Usabilidade

Descrição:
O sistema depende totalmente da inserção manual de metadados dos títulos, como ano, editora e gênero.

Impacto:
Pode tornar o cadastro de grandes bibliotecas mais demorado.

### Limitação 3: Edição de páginas de uma edição
Categoria: Funcional

Descrição:
Após o envio de uma edição, o sistema extrai automaticamente todas as páginas do arquivo enviado e as armazena no diretório correspondente. No entanto, não existe atualmente uma funcionalidade que permita editar ou remover páginas individualmente.

Caso o usuário envie uma edição contendo páginas duplicadas, páginas fora de ordem ou páginas incorretas, a única forma de correção é excluir completamente a edição e realizar um novo upload do arquivo.

Impacto:
Essa limitação pode tornar a correção de erros mais trabalhosa, especialmente em arquivos compactados (.cbr ou .cbz), nos quais a extração manual das páginas pode ser menos intuitiva para o usuário.

Frequência: Média

### Limitação 4: Ausência de mecanismos de segurança para ambiente público
Categoria: Segurança

Descrição:
O sistema foi projetado para uso local por um único usuário e não possui mecanismos robustos de segurança, como autenticação, controle de acesso, proteção contra uploads maliciosos ou limitação de requisições.

Devido a essas características, o sistema não é adequado para ser implantado diretamente em um servidor público na internet.

Impacto:
Caso fosse disponibilizado publicamente sem camadas adicionais de segurança, o sistema poderia ser alvo de ataques automatizados, upload de arquivos maliciosos ou exploração de vulnerabilidades.

Frequência: Alta (caso exposto à internet)

### Limitação 5: Organização limitada da lista de favoritos
Categoria: Usabilidade

Descrição:
A página de favoritos exibe apenas uma lista simples de títulos marcados pelo usuário. Atualmente não existem ferramentas internas de filtragem, ordenação ou busca dentro dessa página.

Quando o número de títulos favoritados cresce significativamente, a navegação e localização de itens específicos pode se tornar mais difícil.

Impacto:
Usuários com bibliotecas maiores podem precisar recorrer aos filtros disponíveis na página inicial para localizar títulos específicos, o que reduz a eficiência da navegação dentro da própria seção de favoritos.

Frequência: Média

### Limitação 6: Dependência de bibliotecas externas para processamento de arquivos
Categoria: Técnica

Descrição:
O sistema depende de extensões externas como php_rar, imagick e ghostscript para processamento de determinados formatos de arquivos.

Impacto:
A instalação dessas dependências pode exigir configuração adicional no ambiente do usuário, o que pode dificultar a implantação em alguns sistemas.

### Limitação 7: Processamento síncrono de uploads e extração de arquivos
Categoria: Arquitetura / Performance

Descrição:
O processamento dos uploads ocorre de forma síncrona durante a requisição HTTP. Isso inclui:
- upload do arquivo
- detecção de formato
- extração das páginas
- conversão de PDF em imagens

Todo esse processamento ocorre dentro da mesma execução do script PHP responsável pelo envio da edição.

Impacto:
- uploads grandes podem aumentar significativamente o tempo de resposta
- risco de timeout em arquivos muito grandes
- consumo elevado de CPU durante a requisição
- impossibilidade de processar múltiplos uploads simultaneamente com eficiência

Esse modelo funciona bem em ambientes locais ou com poucos usuários, mas pode apresentar limitações em cenários com maior volume de arquivos ou requisições.

Frequência: Média

### Limitação 8: Forte acoplamento entre armazenamento de arquivos e estrutura do sistema
Categoria: Arquitetura

Descrição:
O sistema armazena diretamente no sistema de arquivos do servidor todas as páginas extraídas das edições enviadas. A estrutura de diretórios está diretamente vinculada à organização lógica do sistema (títulos, edições e páginas).

Isso cria um forte acoplamento entre:
- estrutura do banco de dados
- estrutura de diretórios no servidor
- lógica de leitura das páginas
- Qualquer alteração na forma de organização dos arquivos exige também alterações na lógica do sistema e na estrutura de armazenamento.

Impacto:
- dificulta migração para outros tipos de armazenamento (ex: cloud storage)
- dificulta reorganização da biblioteca
- aumenta risco de inconsistência entre banco de dados e arquivos físicos. Por exemplo, se um diretório for removido manualmente, o banco de dados pode continuar apontando para páginas inexistentes.

Frequência: Média

### Limitação 9: Folha de estilos centralizada e pouco modular
Categoria: Arquitetura / Manutenibilidade

Descrição:
Durante o desenvolvimento inicial do sistema, todos os estilos CSS foram implementados em um único arquivo centralizado. Com o crescimento do projeto e a adição de novas páginas e componentes, esse arquivo passou a concentrar uma grande quantidade de regras, dificultando a manutenção e organização do código.

Impacto:
- dificuldade para localizar estilos específicos
- maior risco de conflitos entre seletores
- baixa modularidade do frontend

## 6. Melhorias Propostas
### Melhoria 1: Modularização do sistema de estilos com SCSS
Categoria: Arquitetura / Manutenibilidade
Status: Em implementação (Refatoração de arquitetura CSS).

Problema atual:
O sistema atualmente utiliza uma única folha de estilos CSS centralizada. Com o crescimento do projeto e o aumento do número de páginas e componentes, esse arquivo tornou-se extenso e difícil de manter, dificultando a organização do código e a reutilização de estilos.

Solução implementada:
Substituição do arquivo style2.css (+1000 linhas) por uma arquitetura modular baseada em SASS/SCSS. A nova estrutura utiliza o conceito de partials para separar lógica de variáveis, mixins de responsividade e estilos específicos por componente.

Destaque Técnico: Implementação de Design System simplificado com variáveis centralizadas para a paleta "Comic Book" e uso de filtros SVG fractais para texturização de interface sem perda de performance.

Estrutura proposta:
```text
style/
└── scss/
    ├── base/
    │   ├── _global.scss
    │   ├── _reset.scss
    │   └── _typography.scss
    ├── components/
    │   ├── _button.scss
    │   ├── _card.scss
    │   ├── _footer.scss
    │   ├── _header.scss
    │   ├── _input.scss
    │   ├── _modal.scss
    │   └── _tooltip.scss
    ├── config/
    │   ├── _mixins.scss
    │   └── _variables.scss
    ├── pages/
    │   ├── _dashboard.scss
    │   ├── _favorite.scss
    │   ├── _read.scss
    │   ├── _templateUpdate.scss
    │   ├── _titlesUp.scss
    │   └── _upload-update.scss
    └── main.scss
├── main.css
└── main_css.map
```

Impacto esperado:
- melhor organização do código
- maior facilidade de manutenção
- reutilização de estilos e variáveis
- Otimização de Assets: Uso de texturização procedural via filtros SVG, reduzindo a dependência de imagens de fundo externas e melhorando a performance de carregamento.

### Melhoria 2: Redesign visual inspirado em quadrinhos
Categoria: Interface / Experiência do Usuário

Problema atual:
A interface atual do sistema possui um estilo visual genérico que não explora plenamente o tema de quadrinhos do projeto.

Solução proposta:
Implementar um novo design visual inspirado em elementos gráficos característicos de quadrinhos, como:
- painéis com bordas marcadas
- paleta de cores mais vibrante
- tipografia estilizada
- elementos visuais que remetam à estética de HQs

Sempre que possível, serão utilizadas técnicas avançadas de CSS (gradients, pseudo-elementos e efeitos visuais) para evitar o uso excessivo de imagens, reduzindo o peso das páginas e melhorando o desempenho de carregamento.

Impacto esperado:
- identidade visual mais coerente com o tema do sistema
- melhoria da experiência do usuário
- redução do número de requisições HTTP

### Melhoria 3: Arquitetura de Navegação Híbrida (SPA-like) e Transições Dinâmicas
Categoria: Experiência do Usuário (UX) / Arquitetura Frontend
Status: Em planejamento / Prototipagem.

Problema atual:
O sistema opera no modelo tradicional de MPA (Multi-Page Application), onde cada clique no menu dispara uma nova requisição HTTP completa. Isso causa o "flash" branco na tela, reinicia o estado dos scripts e interrompe a imersão do usuário, especialmente durante a leitura de HQs.

Solução proposta:
Implementar uma interface de página única (Single Page Interface) utilizando o conceito de Client-Side Routing.
- Container Principal: A principal.html atuará como um "Shell App", permanecendo fixa enquanto apenas o conteúdo central (Dashboard, Favoritos, Leitor) é trocado.
- Carregamento Dinâmico (AJAX/Fetch): O conteúdo das seções será requisitado via JavaScript e injetado em um container específico (#main-content).
- Animações de Transição: Utilização de CSS Transitions para criar o efeito de "slide lateral" entre as telas, proporcionando uma percepção de continuidade similar a aplicativos mobile nativos.

Destaque Técnico: O desafio do ciclo de vida (Lifecycle):
Como o navegador não recarrega mais, foi necessário criar a função iniciarFiltros() e sistemas de cleanup para garantir que, ao trocar de "página", os eventos do JavaScript antigo sejam removidos e os novos sejam anexados corretamente aos novos elementos do DOM.

Impacto esperado:
- Performance Percebida: Redução drástica no tempo de resposta visual, já que o navegador não precisa baixar novamente o Header, Footer e Scripts base.
- Fluidez: Navegação ininterrupta e transições suaves que reforçam a identidade visual de "aplicativo".
- Persistência de Estado: Possibilidade de manter um player de música ou o progresso de leitura ativo enquanto o usuário navega por outras seções do site.

### Melhoria 4: Implementação de sistema multiusuário com autenticação via Google
Categoria: Funcional / Segurança
Status: Não iniciado.

Problema atual:
O sistema atual foi projetado para uso de um único usuário administrador e não possui suporte a múltiplas contas.

Solução proposta:
Implementar suporte a múltiplos usuários utilizando autenticação via Google OAuth.

Esse método permite que usuários realizem login utilizando suas contas Google, evitando a necessidade de implementar e manter um sistema próprio de gerenciamento de senhas.

Os dados armazenados para cada usuário incluirão apenas informações essenciais, como:
- identificador Google (Google ID)
- nome
- e-mail

Impacto esperado:
- suporte a múltiplos usuários
- simplificação do sistema de autenticação
- maior segurança no processo de login

### Melhoria 5: Sistema de processamento assíncrono de uploads
Categoria: Arquitetura / Performance
Status: Não iniciado.

Problema atual:
O envio e processamento de arquivos ocorre de forma síncrona durante a requisição HTTP, o que pode gerar longos tempos de espera, especialmente ao lidar com arquivos grandes (por exemplo, arquivos .cbz com centenas de megabytes).

Solução proposta:
Implementar um sistema de processamento assíncrono baseado em fila de tarefas.

Nesse modelo:
- o arquivo é enviado pelo usuário e registrado na fila de processamento
- um processo interno (worker) executa a extração e conversão das páginas em segundo plano
- o sistema atualiza o status do processamento no banco de dados

Dessa forma, o usuário não precisa permanecer na página aguardando a conclusão do processamento.

Impacto esperado:
- melhor experiência de uso
- suporte mais eficiente a arquivos grandes
- redução de risco de timeout de requisições

### Melhoria 6: Fortalecimento da segurança no envio de arquivos
Categoria: Segurança
Status: não iniciado.

Problema atual:
O sistema atual possui validações básicas de upload, mas pode ser aprimorado para reduzir riscos associados ao envio de arquivos potencialmente maliciosos.

Solução proposta:
Implementar camadas adicionais de validação no sistema de upload, incluindo:
- verificação de tipo MIME real do arquivo
- validação de extensões permitidas
- limitação de tamanho de arquivo
- limitação de frequência de uploads por usuário (rate limiting)

Essas medidas reduzem o risco de exploração do sistema por meio de uploads maliciosos ou uso abusivo do serviço.

Impacto esperado:
- maior segurança no processamento de arquivos
- redução do risco de ataques baseados em upload

### Melhoria 7: Sistema de edição de páginas de edições
Categoria: Funcional / Usabilidade
Status: não iniciado.

Problema atual:
Atualmente, após o envio de uma edição, não é possível editar ou remover páginas individualmente. Caso exista algum erro (como páginas duplicadas ou fora de ordem), o usuário precisa excluir toda a edição e realizar um novo envio.

Solução proposta:
Implementar um sistema de gerenciamento de páginas que permita:
- remover páginas individuais
- reorganizar a ordem das páginas
- substituir páginas específicas

Essa funcionalidade permitirá corrigir erros sem necessidade de reenviar toda a edição.

Impacto esperado:
- maior flexibilidade no gerenciamento de edições
- redução do retrabalho para o usuário
- melhoria geral na usabilidade do sistema

### Melhoria 8: Desacoplamento e Modularização do JavaScript (ES6+ Events)
Categoria: Arquitetura Frontend / Manutenibilidade
Status: Em progresso (Refatoração estrutural).

Problema atual:
Anteriormente, a lógica de interação (favoritar, deletar, editar) estava concentrada em arquivos globais densos (api_t.js), dificultando a depuração e causando conflitos de eventos quando novos elementos eram carregados dinamicamente via AJAX.

Solução em implementação:
Migração para um modelo de Arquitetura Baseada em Componentes e Delegação de Eventos. Cada funcionalidade crítica foi isolada em seu próprio módulo:

- btn_favorite.js: Gerencia exclusivamente a lógica de persistência de favoritos.
- btn_delete.js: Centraliza as confirmações e chamadas de exclusão.
- btn_edit.js: Controla a abertura e submissão de formulários de edição.

Mudança de Paradigma (Lifecycle):
Com a transição para a principal.html como container central, foi implementado um sistema de "Iniciadores de Filtros" (iniciarFiltros()). Isso garante que os ouvintes de eventos sejam anexados corretamente apenas quando o conteúdo do Dashboard é injetado no DOM, evitando memory leaks e seletores órfãos.

Impacto esperado:
- Código DRY (Don't Repeat Yourself): Reutilização de funções de CRUD em diferentes partes do sistema.
- Performance: Carregamento seletivo de scripts conforme a necessidade da página.
- Escalabilidade: Facilidade para adicionar futuras novas ações (ex: "marcar como lido") sem tocar no código de outras funcionalidades.

## 7. Plano de Implementação
Fase 1
- Análise do código existente
- Planejamento das melhorias

Fase 2
- Implementação das novas funcionalidades

Fase 3
- Refatoração e testes

Fase 4
- Documentação final e comparação antes/depois

## Prioridade de Implementação
Prioridade Alta:
- Redesign visual inspirado em quadrinhos.
- Modularização do sistema de estilos com SCSS.
- Arquitetura de Navegação Híbrida (SPA-like) e Transições Dinâmicas.
- Desacoplamento e Modularização do JavaScript (ES6+ Events)

Prioridade Media
- Sistema de edição de páginas de edições.
- Sistema de processamento assíncrono de uploads.

Prioridade Baixa:
- Implementação de sistema multiusuário com autenticação via Google.
- Fortalecimento da segurança no envio de arquivos.