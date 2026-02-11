import express from "express";
import fetch from "node-fetch";
const router = express.Router();

const API_KEY = "RGAPI-874a8b78-c371-49a4-ac5d-2034e50da294";

router.get("/accountPUUID/:gameName/:tag", async (req, res) => {
	const { gameName, tag } = req.params;

	try {

		const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tag}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"X-Riot-Token": API_KEY
			},
		});

		const data = await response.json();

		res.json({ data: data , error: "" });
	} catch (error) {
		if (error.response) {
			res.json({ data: {} , error: error.response.data });
			console.error("Status:", error.response.status);
			console.error("Data:", error.response.data);
		} else {
			console.err("else error")
			res.json({ data: {} , error: error.message });
		}
	}
});

router.get("/info/:puuid", async (req, res) => {
	const { puuid } = req.params;

	try {

		const url = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"X-Riot-Token": API_KEY
			},
		});

		const data = await response.json();

		res.json({ data: data , error: "" });
	} catch (error) {
		if (error.response) {
			res.json({ data: {} , error: error.response.data });
			console.error("Status:", error.response.status);
			console.error("Data:", error.response.data);
		} else {
			console.err("else error")
			res.json({ data: {} , error: error.message });
		}
	}
});


router.post("/insertFolder", async (req, res) => {
	try {

		const folderData = req.body; // cualquier objeto: {name, original_name, ...}
		//console.log(`supabase/insertFolder/${folderData.name}`)
		//console.log("	", folderData)
		// Agregar updated_at automáticamente
		folderData.updated_at = new Date().toISOString();

		// Validar que haya algo que actualizar
		if (!Object.keys(folderData).length) {
			return res.status(400).json({ error: "No hay campos para insertar" });
		}

		const { error } = await supabase
			.from('folders')
			.insert([folderData])
			.select()
			.single();

		if (error) return res.status(500).json({ error: error.message });

		res.json({ error: "" });
	} catch (err) {
		console.error(new Date().toISOString(), err);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});




export default router;