import * as fs from "fs";
import express from "express";
//@ts-ignore
import expressStreamVideo from "express-stream-video";
import path from "path";

import https from "https";

import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));

app.get("/video/:fileName", function (req, res) {
	const filePath = path.join(__dirname, "/videos/" + req.params.fileName);

	const stat = fs.statSync(filePath);
	const fileSize = stat.size;
	const range = req.headers.range;

	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 1);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

		if (start >= fileSize) {
			res.status(416).send("Requested range not satisfiable\n" + start + " >= " + fileSize);
			return;
		}

		const chunksize = end - start + 1;
		const file = fs.createReadStream(filePath, { start, end });
		const head = {
			"Content-Range": `bytes ${start}-${end}/${fileSize}`,
			"Accept-Ranges": "bytes",
			"Content-Length": chunksize,
			"Content-Type": "video/mp4",
		};

		res.writeHead(206, head);
		file.pipe(res);
	} else {
		console.log(req.headers);
		const head = {
			"Content-Length": fileSize,
			"Content-Type": "video/mp4",
		};
		res.writeHead(200, head);
		fs.createReadStream(filePath).pipe(res);
	}
});


app.listen(3000)

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
