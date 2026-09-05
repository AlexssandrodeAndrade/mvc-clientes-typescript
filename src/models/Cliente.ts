import { pool } from "../database.js";

export interface Cliente {
    id?: number;
    nome: string;
    cpf: string;
    email: string;
    estadoCivil: string;
    ativo: boolean;
}

export class ClienteModel {
    id?: number;
    nome: string;
    cpf: string;
    email: string;
    estadoCivil: string;
    ativo: boolean;

    constructor(dados: Cliente) {
        this.id = dados.id;
        this.nome = dados.nome;
        this.cpf = dados.cpf;
        this.email = dados.email;
        this.estadoCivil = dados.estadoCivil;
        this.ativo = dados.ativo;
    }

    static async listar(): Promise<Cliente[]> {
        const resultado = await pool.query(`
            SELECT
                id,
                nome,
                cpf,
                email,
                estado_civil AS "estadoCivil",
                ativo
            FROM clientes
            ORDER BY id
        `);

        return resultado.rows;
    }

    async cadastrar(cliente: Cliente): Promise<Cliente> {
            const resultado = await pool.query(
                    `
                        INSERT INTO clientes
                            (nome, cpf, email, estado_civil, ativo)
                        VALUES
                            ($1, $2, $3, $4, $5)
                        RETURNING
                            id,
                            nome,
                            cpf,
                            email,
                            estado_civil AS "estadoCivil",
                            ativo
                        `,
                        [
                            cliente.nome,
                            cliente.cpf,
                            cliente.email,
                            cliente.estadoCivil,
                            cliente.ativo
                        ]
                    );

        return resultado.rows[0];
    }

    async atualizar(id: number, cliente: Cliente): Promise<Cliente | undefined> {
        const resultado = await pool.query(
            `
            UPDATE clientes
            SET
                nome = $1,
                cpf = $2,
                email = $3,
                estado_civil = $4,
                ativo = $5
            WHERE id = $6
            RETURNING
                id,
                nome,
                cpf,
                email,
                estado_civil AS "estadoCivil",
                ativo
            `,
            [
                cliente.nome,
                cliente.cpf,
                cliente.email,
                cliente.estadoCivil,
                cliente.ativo,
                id
            ]
        );

        return resultado.rows[0];
    }

    static async remover(id: number): Promise<boolean> {
        const resultado = await pool.query(
            `
            DELETE FROM clientes
            WHERE id = $1
            `,
            [id]
        );

        return (resultado.rowCount ?? 0) > 0;
    }
}