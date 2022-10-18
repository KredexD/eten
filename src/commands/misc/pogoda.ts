import fetch from "node-fetch";
import joinImages from "../../lib/joinImages";
import fs from "fs";
import util from "util";
import stream from "stream";
const streamPipeline = util.promisify(stream.pipeline);
import Discord, { CommandInteraction } from "discord.js";
import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";

export const data = new SlashCommandBuilder()
	.setName("pogoda")
	.setDescription("Pogoda z meteo.pl")
	.addStringOption(
		new SlashCommandStringOption()
			.setName("miasto")
			.setDescription("Miasto")
			.setRequired(false)
	);

export async function execute(interaction: CommandInteraction) {
	let title, imgResult;
	if (interaction.isCommand !== undefined && interaction.isCommand()) {
		await interaction.deferReply();

		let miasto;
		if (interaction.options.getString("miasto") === null)
			miasto = "warszawa";
		else
			miasto = interaction.options.getString("miasto").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		const result = await fetch("https://m.meteo.pl/" + miasto + "/60");

		if (result.status == 404) {
			interaction.editReply("Złe miasto");
			return;
		}

		const resultText = await result.text();
		title = resultText.split("<h2 class=\"titlePogoda\"><b><span>")[1].split("</span>")[0];
		const link = /src="(https:\/\/www\.meteo\.pl\/um\/metco\/mgram_pict\.php\?ntype=0u&fdate=[0-9]+&row=[0-9]+&col=[0-9]+&lang=pl)"/g.exec(resultText)[1];
		imgResult = await fetch(link, {
			headers: {
				Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
				"Accept-Encoding": "gzip, deflate, br",
				"Accept-Language": "en-GB,en;q=0.9",
				Host: "www.meteo.pl",
				Referer: "https://m.meteo.pl/",
				"Sec-Fetch-Dest": "image",
				"Sec-Fetch-Mode": "no-cors",
				"Sec-Fetch-Site": "same-site",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
			}
		});

		if (!imgResult.ok)
			throw new Error(`Unexpected response ${result.statusText}`);
	}
	else {
		const result = await fetch("https://m.meteo.pl/warszawa/60");
		if (!result.ok) throw new Error(`Unexpected response ${result.statusText}`);
		const resultText = await result.text();
		const imageRegex = /src="(https:\/\/www\.meteo\.pl\/um\/metco\/mgram_pict\.php\?ntype=0u&fdate=[0-9]+&row=406&col=250&lang=pl)"/g;
		const link = imageRegex.exec(resultText)[1];
		imgResult = await fetch(link, {
			headers: {
				Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
				"Accept-Encoding": "gzip, deflate, br",
				"Accept-Language": "en-GB,en;q=0.9",
				Host: "www.meteo.pl",
				Referer: "https://m.meteo.pl/",
				"Sec-Fetch-Dest": "image",
				"Sec-Fetch-Mode": "no-cors",
				"Sec-Fetch-Site": "same-site",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
			}
		});
		if (!imgResult.ok) throw new Error(`Unexpected response ${result.statusText}`);
		title = "Warszawa";
	}
	await streamPipeline(imgResult.body, fs.createWriteStream("./tmp/weather.png"));
	joinImages("data/leg60.png", "tmp/weather.png", "tmp/weatherFinal.png");

	const weatherAttachment = new Discord.MessageAttachment("./tmp/weatherFinal.png");
	if (interaction.isCommand !== undefined && interaction.isCommand())
		await interaction.editReply({ content: title + ":", files: [weatherAttachment] });
	else
		interaction.reply({ content: title + ":", files: [weatherAttachment] });
}