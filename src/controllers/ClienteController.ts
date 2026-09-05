import { Request, Response } from "express";
import { ClienteModel } from "../models/Cliente.js";

export class ClienteController {
    async listar(request: Request, response: Response): Promise<void> {
        const clientes = await ClienteModel.listar();
        response.json(clientes);
    }

    async cadastrar(request: Request, response: Response): Promise<void> {
        let status: number;
        let resposta: string | unknown;

        try {
            const { nome, cpf, email, estadoCivil, ativo } = request.body;

            const cliente: ClienteModel = new ClienteModel({
                nome,
                cpf,
                email,
                estadoCivil,
                ativo
            });
            
            status = 201;
            resposta = await cliente.cadastrar(cliente);
            //console.log(resposta);
            //response.status(201).json(resposta);
        } catch (error) {
            
            status = 401;
            resposta = error;

            //response.status(401).json(error);
            
        }
        
        console.log(resposta);
       response.status(status).json(resposta);
    }

    async atualizar(request: Request, response: Response): Promise<void> {
        const id = Number(request.params.id);
        const { nome, cpf, email, estadoCivil, ativo } = request.body;

        const cliente: ClienteModel = new ClienteModel({
            nome,
            cpf,
            email,
            estadoCivil,
            ativo
        });

        const resposta = await cliente.atualizar(id, cliente);

        if (!resposta) {
            response.status(404).json({
                mensagem: "Cliente não encontrado"
            });
            return;
        }

        response.json(resposta);
    }

    async remover(request: Request, response: Response): Promise<void> {
        const id = Number(request.params.id);

        const removido = await ClienteModel.remover(id);

        if (!removido) {
            response.status(404).json({
                mensagem: "Cliente não encontrado"
            });
            return;
        }

        response.json({
            mensagem: "Cliente removido com sucesso"
        });
    }
}