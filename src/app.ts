import express from "express";
import clienteRoutes from "./routes/clienteRoutes.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use("/clientes", clienteRoutes);

app.listen(3000,() => {
    console.log(
        "Servidor rodando em http://localhost:3000"
    );
});
