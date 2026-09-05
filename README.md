# Projeto para fins didáticos

## Aula do curso NODE (SENAI)

API REST simples de cadastro de clientes, feita com **Node.js**, **TypeScript**, **Express** e **PostgreSQL**.

## Pré-requisitos

Antes de começar, instale:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/download/) (ou Docker, se preferir subir o banco em container)
- Extensão Thunder Client para testar as rotas da API

## 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd mvc-clientes-typescript
```

## 2. Instalar as dependências

```bash
npm install
```

## 3. Configurar o banco de dados

Crie um banco de dados PostgreSQL (pode usar o nome que quiser, ex: `postgres`) e rode o script de criação da tabela que está em `sql/create-table.sql`.

## 4. Configurar as variáveis de ambiente

Crie o arquivo .env e insira os dados do seu banco, utilizando o .env.example como exemplo:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=senai
DB_DATABASE=postgres
```

## 5. Rodar o projeto

Modo desenvolvimento (recompila e reinicia automaticamente a cada alteração):

```bash
npm run dev
```

Ou, para rodar em produção (compila e depois executa):

```bash
npm run build
npm start
```

O servidor sobe em **http://localhost:3000**.

## Endpoints da API

Todas as rotas usam o prefixo `/clientes`.

| Método | Rota            | Descrição                     |
| ------ | --------------- | ----------------------------- |
| GET    | `/clientes`     | Lista todos os clientes       |
| POST   | `/clientes`     | Cadastra um novo cliente      |
| PUT    | `/clientes/:id` | Atualiza um cliente existente |
| DELETE | `/clientes/:id` | Remove um cliente             |

### Exemplo de corpo para POST/PUT

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

```
src/
├── app.ts                      # ponto de entrada, configura o Express
├── database.ts                 # conexão com o PostgreSQL (pg)
├── controllers/
│   └── ClienteController.ts    # regras de entrada/saída HTTP
├── models/
│   └── Cliente.ts              # acesso ao banco (queries SQL)
└── routes/
    └── clienteRoutes.ts        # definição das rotas
sql/
└── create-table.sql            # script de criação da tabela clientes
```

## Problemas comuns

- **Erro de conexão com o banco**: confira se o PostgreSQL está rodando e se os dados em `.env` (host, porta, usuário, senha, nome do banco) estão corretos.
- **`relation "clientes" does not exist`**: rode o script `sql/create-table.sql` no banco configurado no `.env`.

## TO-DO

Estão ocorrendo dois erros ao compilar o código. Corrigir.
