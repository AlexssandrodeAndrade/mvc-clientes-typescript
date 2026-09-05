import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;

// ============================================================
// CONFIGURAÇÃO DO SCRIPT
// ============================================================
//
// O script deve ficar dentro da pasta:
//
// scripts/setup-database.mjs
//
// A partir da localização deste arquivo, encontramos automaticamente
// a raiz do projeto.
//
// Estrutura esperada:
//
// projeto/
// ├── database/
// │   ├── tables/
// │   │   └── *.sql
// │   └── seeds/
// │       └── *.sql
// ├── scripts/
// │   └── setup-database.mjs
// ├── .env
// └── .env.example
//

const pastaScript = dirname(fileURLToPath(import.meta.url));
const raizProjeto = join(pastaScript, '..');

const caminhoEnv = join(raizProjeto, '.env');
const caminhoEnvExample = join(raizProjeto, '.env.example');

const pastaTables = join(raizProjeto, 'database', 'tables');
const pastaSeeds = join(raizProjeto, 'database', 'seeds');

// Permite executar:
//
// npm run db:setup -- force
//
// ou:
//
// npm run db:setup -- --force
//
const usarForce = process.argv.includes('force') || process.argv.includes('--force');

// ============================================================
// CARREGAR O ARQUIVO .ENV
// ============================================================
//
// O .env é obrigatório.
//
// Caso ele não exista, o script é interrompido antes de qualquer
// tentativa de conexão com o PostgreSQL.
//

function carregarEnv() {
    if (!existsSync(caminhoEnv)) {
        if (existsSync(caminhoEnvExample)) {
            throw new Error(
                [
                    'Arquivo .env não encontrado.',
                    '',
                    'Crie o arquivo usando:',
                    '',
                    'cp .env.example .env',
                ].join('\n'),
            );
        }

        throw new Error(
            ['Arquivo .env não encontrado.', '', 'Crie um arquivo .env na raiz do projeto.'].join(
                '\n',
            ),
        );
    }

    // quiet: true evita as mensagens informativas do dotenv
    // durante a execução do script.
    dotenv.config({
        path: caminhoEnv,
        quiet: true,
    });
}

// ============================================================
// CONFIGURAÇÃO DO BANCO
// ============================================================
//
// Depois que o .env for carregado, esta função monta os dados
// necessários para conexão com o PostgreSQL.
//
// O nome do banco pode ser definido usando:
//
// DB_NAME
//
// ou:
//
// DB_DATABASE
//

function obterConfiguracaoBanco() {
    const nomeBanco = process.env.DB_NAME?.trim() || process.env.DB_DATABASE?.trim();

    const conexao = {
        host: process.env.DB_HOST?.trim(),
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER?.trim(),
        password: process.env.DB_PASSWORD,
    };

    return {
        nomeBanco,
        conexao,
    };
}

// ============================================================
// VALIDAR VARIÁVEIS DO .ENV
// ============================================================
//
// Antes de conectar ao PostgreSQL, verificamos se todas as
// configurações obrigatórias foram informadas.
//
// Isso evita erros pouco claros vindos diretamente do driver pg.
//

function validarEnv(nomeBanco, conexao) {
    const variaveisFaltando = [];

    if (!process.env.DB_HOST?.trim()) {
        variaveisFaltando.push('DB_HOST');
    }

    if (!process.env.DB_PORT?.trim()) {
        variaveisFaltando.push('DB_PORT');
    }

    if (!process.env.DB_USER?.trim()) {
        variaveisFaltando.push('DB_USER');
    }

    if (!process.env.DB_PASSWORD?.trim()) {
        variaveisFaltando.push('DB_PASSWORD');
    }

    if (!nomeBanco) {
        variaveisFaltando.push('DB_NAME ou DB_DATABASE');
    }

    if (variaveisFaltando.length > 0) {
        throw new Error(
            [
                'Arquivo .env incompleto.',
                '',
                'Variáveis obrigatórias:',
                ...variaveisFaltando.map((variavel) => `- ${variavel}`),
            ].join('\n'),
        );
    }

    // Além de existir, a porta precisa ser um número válido.
    if (!Number.isInteger(conexao.port) || conexao.port <= 0 || conexao.port > 65535) {
        throw new Error('DB_PORT deve conter uma porta válida.');
    }
}

// ============================================================
// SEGURANÇA DO BANCO
// ============================================================
//
// Esses bancos pertencem ao próprio PostgreSQL e não devem ser
// utilizados como banco da aplicação.
//
// Essa proteção é especialmente importante porque o parâmetro
// "force" permite apagar o banco.
//

function validarBancoProtegido(nomeBanco) {
    const bancosProtegidos = ['postgres', 'template0', 'template1'];

    if (bancosProtegidos.includes(nomeBanco.toLowerCase())) {
        throw new Error(`O banco "${nomeBanco}" não pode ser usado.`);
    }
}

// ============================================================
// ESCAPAR O NOME DO BANCO
// ============================================================
//
// CREATE DATABASE e DROP DATABASE não aceitam parâmetros como $1
// para o identificador do banco.
//
// Por isso precisamos escapar corretamente possíveis aspas no nome.
//

function escaparNomeBanco(nome) {
    return `"${nome.replaceAll('"', '""')}"`;
}

// ============================================================
// LISTAR ARQUIVOS SQL
// ============================================================
//
// Retorna todos os arquivos .sql de uma pasta em ordem alfabética.
//
// Para database/tables:
//
// obrigatorio = true
//
// Para database/seeds:
//
// obrigatorio = false
//

function listarArquivosSql(pasta, obrigatorio = true) {
    if (!existsSync(pasta)) {
        if (obrigatorio) {
            throw new Error(`Pasta obrigatória não encontrada:\n${pasta}`);
        }

        return [];
    }

    const arquivos = readdirSync(pasta)
        .filter((arquivo) => arquivo.toLowerCase().endsWith('.sql'))
        .sort();

    // Não basta a pasta database/tables existir.
    // Ela precisa possuir pelo menos um arquivo SQL.
    if (obrigatorio && arquivos.length === 0) {
        throw new Error(`Nenhum arquivo .sql encontrado em:\n${pasta}`);
    }

    return arquivos;
}

// ============================================================
// VALIDAR ESTRUTURA DO BANCO
// ============================================================
//
// Essa validação acontece ANTES da criação do banco.
//
// Portanto, se database/tables estiver ausente ou vazia,
// nenhum banco vazio será criado no PostgreSQL.
//

function validarEstruturaBanco() {
    listarArquivosSql(pastaTables, true);
}

// ============================================================
// PREPARAR O BANCO
// ============================================================
//
// Esta função conecta primeiro ao banco administrativo "postgres".
//
// Existem três situações:
//
// 1. Banco não existe:
//    -> cria o banco.
//
// 2. Banco existe sem force:
//    -> não altera nada.
//
// 3. Banco existe com force:
//    -> encerra conexões;
//    -> apaga o banco;
//    -> cria novamente.
//

async function prepararBanco(nomeBanco, conexao) {
    const cliente = new Client({
        ...conexao,
        database: 'postgres',
    });

    await cliente.connect();

    try {
        // Verifica se o banco já existe.
        const resultado = await cliente.query(
            `
                SELECT 1
                FROM pg_database
                WHERE datname = $1
                `,
            [nomeBanco],
        );

        const bancoExiste = resultado.rowCount > 0;

        // ----------------------------------------------------
        // BANCO JÁ EXISTE
        // ----------------------------------------------------

        if (bancoExiste && !usarForce) {
            console.log(`Banco "${nomeBanco}" já existe.`);

            console.log('');
            console.log('Para apagar e recriar o banco, execute:');
            console.log('');
            console.log('npm run db:setup -- force');

            return false;
        }

        // ----------------------------------------------------
        // FORCE
        // ----------------------------------------------------
        //
        // Antes de apagar o banco, encerramos outras conexões
        // que possam estar utilizando ele.
        //

        if (bancoExiste && usarForce) {
            console.log(`Apagando banco "${nomeBanco}"...`);

            await cliente.query(
                `
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = $1
                  AND pid <> pg_backend_pid()
                `,
                [nomeBanco],
            );

            await cliente.query(`DROP DATABASE ${escaparNomeBanco(nomeBanco)}`);

            console.log(`Banco "${nomeBanco}" apagado.`);
        }

        // ----------------------------------------------------
        // CRIAR BANCO
        // ----------------------------------------------------

        await cliente.query(`CREATE DATABASE ${escaparNomeBanco(nomeBanco)}`);

        console.log(`Banco "${nomeBanco}" criado.`);

        return true;
    } finally {
        // A conexão administrativa sempre deve ser encerrada.
        await cliente.end();
    }
}

// ============================================================
// EXECUTAR ARQUIVOS SQL
// ============================================================
//
// Executa todos os arquivos .sql encontrados em uma determinada
// pasta.
//
// Arquivos vazios são simplesmente ignorados.
//

async function executarPastaSql(cliente, pasta, obrigatorio = true) {
    const arquivos = listarArquivosSql(pasta, obrigatorio);

    for (const arquivo of arquivos) {
        const caminho = join(pasta, arquivo);

        const sql = readFileSync(caminho, 'utf8').trim();

        // Arquivos SQL vazios não precisam ser executados.
        if (!sql) {
            console.log(`Ignorando ${arquivo}: arquivo vazio.`);

            continue;
        }

        console.log(`Executando ${arquivo}...`);

        await cliente.query(sql);
    }

    return arquivos.length;
}

// ============================================================
// CONFIGURAR O BANCO
// ============================================================
//
// Depois que o banco estiver criado, conectamos diretamente nele.
//
// Primeiro são executadas as tabelas.
//
// Depois, caso database/seeds exista e possua arquivos SQL,
// os seeds são executados.
//

async function configurarBanco(nomeBanco, conexao) {
    const cliente = new Client({
        ...conexao,
        database: nomeBanco,
    });

    await cliente.connect();

    try {
        // ----------------------------------------------------
        // TABELAS
        // ----------------------------------------------------

        console.log('');
        console.log('Criando tabelas...');

        await executarPastaSql(cliente, pastaTables, true);

        // ----------------------------------------------------
        // SEEDS
        // ----------------------------------------------------
        //
        // Seeds são opcionais.
        //
        // A mensagem só aparece se realmente existirem
        // arquivos .sql para executar.
        //

        const arquivosSeeds = listarArquivosSql(pastaSeeds, false);

        if (arquivosSeeds.length > 0) {
            console.log('');
            console.log('Executando seeds...');

            await executarPastaSql(cliente, pastaSeeds, false);
        }
    } finally {
        // A conexão com o banco da aplicação sempre é encerrada.
        await cliente.end();
    }
}

// ============================================================
// FLUXO PRINCIPAL
// ============================================================
//
// Todas as validações acontecem antes de qualquer alteração no
// PostgreSQL.
//
// Ordem:
//
// 1. Carregar .env
// 2. Obter configuração
// 3. Validar .env
// 4. Validar banco protegido
// 5. Validar estrutura database/tables
// 6. Criar ou recriar banco
// 7. Executar tabelas
// 8. Executar seeds
//

async function main() {
    // --------------------------------------------------------
    // VALIDAÇÕES
    // --------------------------------------------------------

    carregarEnv();

    const { nomeBanco, conexao } = obterConfiguracaoBanco();

    validarEnv(nomeBanco, conexao);

    validarBancoProtegido(nomeBanco);

    validarEstruturaBanco();

    // --------------------------------------------------------
    // INFORMAÇÕES
    // --------------------------------------------------------

    console.log('');
    console.log(`Banco: ${nomeBanco}`);

    if (usarForce) {
        console.log('Modo reset: banco será recriado.');
    }

    console.log('');

    // --------------------------------------------------------
    // CRIAR / RECRIAR BANCO
    // --------------------------------------------------------

    const bancoCriado = await prepararBanco(nomeBanco, conexao);

    // Se o banco já existir e force não tiver sido informado,
    // não há mais nada para fazer.
    if (!bancoCriado) {
        return;
    }

    // --------------------------------------------------------
    // TABELAS E SEEDS
    // --------------------------------------------------------

    await configurarBanco(nomeBanco, conexao);

    console.log('');
    console.log('Banco configurado com sucesso.');
}

// ============================================================
// TRATAMENTO DE ERROS
// ============================================================
//
// Qualquer erro lançado durante o fluxo passa por aqui.
//
// Dessa maneira evitamos stack traces desnecessários para erros
// de configuração conhecidos e mostramos apenas uma mensagem
// clara para quem está executando o projeto.
//

main().catch((erro) => {
    console.error('');
    console.error('Erro ao configurar banco:');
    console.error('');

    console.error(erro.message);

    console.error('');

    process.exit(1);
});
