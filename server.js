

import express from "express";
import cors from "cors";

import rankRoutes from "./routes/rank.js";






const app = express();
app.use(cors({
  exposedHeaders: ["x-access-token"] // <--- esto es clave
}));
app.use(express.json());

// Rutas
app.use("/rank", rankRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
