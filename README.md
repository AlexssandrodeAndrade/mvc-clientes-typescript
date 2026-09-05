# CRUD MVC de Clientes

Projeto didático desenvolvido para a aula de Node.js do SENAI.

A aplicação possui uma API REST para cadastro de clientes, feita com **Node.js**, **TypeScript**, **Express** e **PostgreSQL**. Também possui uma tela simples em **HTML**, **JavaScript** e **Bootstrap 5** para cadastrar, listar, editar e remover clientes.

## Funcionalidades

- Cadastrar cliente
- Listar clientes
- Editar cliente
- Remover cliente
- Interface web com Bootstrap 5
- Integração com banco de dados PostgreSQL

## Dados do cliente

Cada cliente possui os seguintes campos:

```text
id
nome
cpf
email
estadoCivil
ativo
```

No banco de dados, o campo `estadoCivil` é salvo como `estado_civil`.

## Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- PostgreSQL
- Bootstrap 5

## Pré-requisitos

Antes de rodar o projeto, instale:

- Node.js
- PostgreSQL
- npm

Também é possível testar a API usando Thunder Client, Postman ou Insomnia.

## Instalação

Clone o repositório e entre na pasta do projeto:

```bash
git clone <url-do-repositorio>
cd mvc-clientes-typescript
```

Instale as dependências:

```bash
npm install
```

## Configuração do banco

Crie um arquivo `.env` na raiz do projeto usando o `.env.example` como base:

```env
DB_HOST=localhost
DB_PORT=5434
DB_DATABASE=mvc_clientes
DB_USER=postgres
DB_PASSWORD=postgres
```

Ajuste `DB_PORT`, `DB_USER` e `DB_PASSWORD` de acordo com a configuração do seu PostgreSQL.

Para criar o banco e executar o script da tabela, rode:

```bash
npm run db:setup
```

Se precisar apagar e recriar o banco configurado no `.env`, use:

```bash
npm run db:setup -- force
```

Atenção: o comando com `force` apaga o banco configurado e cria novamente.

## Tabela clientes

O script de criação da tabela fica em:

```text
database/tables/create-table.sql
```

Estrutura da tabela:

```sql
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    estado_civil VARCHAR(50) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);
```

## Como rodar

Para rodar em modo desenvolvimento:

```bash
npm run dev
```

Para compilar e rodar o projeto:

```bash
npm run build
npm start
```

O servidor será iniciado em:

```text
http://localhost:3000
```

## Frontend

A tela web fica disponível em:

```text
http://localhost:3000
```

Nessa tela é possível cadastrar, listar, editar e excluir clientes.

Arquivos do frontend:

```text
public/index.html
public/js/clientes.js
```

## Endpoints da API

Todas as rotas usam o prefixo `/clientes`.

| Método | Rota            | Descrição                     |
| ------ | --------------- | ----------------------------- |
| GET    | `/clientes`     | Lista todos os clientes       |
| POST   | `/clientes`     | Cadastra um novo cliente      |
| PUT    | `/clientes/:id` | Atualiza um cliente existente |
| DELETE | `/clientes/:id` | Remove um cliente             |

## Exemplo de JSON para POST e PUT

```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao@email.com",
  "estadoCivil": "Solteiro",
  "ativo": true
}
```

## Estrutura do projeto

```text
database/
└── tables/
    └── create-table.sql
public/
├── index.html
└── js/
    └── clientes.js
scripts/
└── setup-database.mjs
src/
├── app.ts
├── database.ts
├── controllers/
│   └── ClienteController.ts
├── models/
│   └── Cliente.ts
└── routes/
    └── clienteRoutes.ts
```

## Problemas comuns

- **Erro de conexão com o banco**: confira se o PostgreSQL está rodando e se os dados do `.env` estão corretos.
- **`relation "clientes" does not exist`**: rode `npm run db:setup` para criar o banco e a tabela.
- **CPF ou e-mail duplicado**: a tabela não permite repetir CPF nem e-mail.
