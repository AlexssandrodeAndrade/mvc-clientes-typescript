import { Router } from "express";
import { ClienteController } from "../controllers/ClienteController.js";

const clienteRoutes = Router();
const clienteController = new ClienteController();

clienteRoutes.get("/", clienteController.listar);

clienteRoutes.post("/", clienteController.cadastrar);

clienteRoutes.put("/:id", clienteController.atualizar);

clienteRoutes.delete("/:id", clienteController.remover);

export default clienteRoutes;