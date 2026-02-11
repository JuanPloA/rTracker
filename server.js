

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rankRoutes from "./routes/rank.js";






const app = express();
app.use(cors({
  exposedHeaders: ["x-access-token"] // <--- esto es clave
}));
app.use(express.json());

// Para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos de /dist
app.use(express.static(path.join(__dirname, "dist")));



// Rutas
app.use("/rank", rankRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
