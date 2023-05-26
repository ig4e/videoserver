import * as fs from "fs";
import express from "express";
import path from "path";
import https from "https";
import cors from "cors";
import * as pks from "./package.json";
const serverUrl = "https://server.wolflandrp.xyz";
//const serverUrl = "http://localhost";

const app = express();

app.use(cors({ origin: "*" }));

const routes = [{ "/": "Server Info", "/videos": "List of avalible videos", "/videos/:fileName": "The video output" }];

app.get("/", function (req, res) {
	res.json({ version: pks.version, author: pks.author, routes });
});

app.get("/videos", function (req, res) {
	const dirPath = path.join(__dirname, "/videos/");
	const files = fs.readdirSync(dirPath);

	const data = files.map((file) => {
		const filePath = dirPath + file;
		const fileStats = fs.statSync(filePath);

		return {
			name: file,
			size: fileStats.size,
			url: serverUrl + "/videos/" + encodeURIComponent(`${file}`),
		};
	});

	const totalSize = data.reduce((acc, curr) => acc + curr.size, 0) / 1e6;

	res.json({ files: data, totalSize: totalSize.toFixed(2) + "MB" });
});

app.get("/videos/:fileName", function (req, res) {
	const CHUNK_SIZE = 12 ** 6; // 2.985984MB

	const filePath = path.join(__dirname, "/videos/" + req.params.fileName);

	const stat = fs.statSync(filePath);
	const fileSize = stat.size;
	const range = req.headers.range;

	if (range) {
		const start = Number(range.replace(/\D/g, ""));
		const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
		const contentLength = end - start + 1;

		if (start >= fileSize) {
			res.status(416).send("Requested range not satisfiable\n" + start + " >= " + fileSize);
			return;
		}

		const videoStream = fs.createReadStream(filePath, { start, end });

		const head = {
			"Content-Range": `bytes ${start}-${end}/${fileSize}`,
			"Accept-Ranges": "bytes",
			"Content-Length": contentLength,
			"Content-Type": "video/mp4",
		};

		res.writeHead(206, head);
		videoStream.pipe(res);
	} else {
		res.status(400).send("Requires Range header");
	}

	console.log(req.headers);
});

app.listen(80, () => {
	console.log("HTTP Server running on port 80");
});

// const httpsServer = https.createServer(
// 	{
// 		key: fs.readFileSync(`C:/Certbot/live/server.wolflandrp.xyz/privkey.pem`),
// 		cert: fs.readFileSync("C:/Certbot/live/server.wolflandrp.xyz/fullchain.pem"),
// 	},
// 	app,
// );

// httpsServer.listen(443, () => {
// 	console.log("HTTPS Server running on port 443");
// });
