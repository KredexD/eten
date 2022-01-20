"use strict";

const fetch = (...args) => import("node-fetch").then(({
	default: fetch
}) => fetch(...args));
const config = require("./config.json");
const cookiejar = require('cookiejar');

// TODO:
//  1) ~~Funkcja private na webrequesty po prostu~~
//  2) Coś na zarządzanie ciasteczkami (i ciasteczka w konstruktorze na relogin?)

class LibrusClient {
	/**
	 * @constructor Create a new Librus mobile API client (API version 3)
	 * @param options Constructor options. Cookies or own deviceId.
	 */
	constructor() {
		this.bearerToken = "";
		this.pushDevice = -1;
		this.cookieJar = "";
	}

	/**
	 * Uses existing cached cookies instead of credentials to try and get bearer token.
	 * Use only if you're using cookies through constructor or session is expired and you don't want to execute login() function.
	 */
	async restoreToken() {
		// Get the newer accessToken
		let result;
		try {
			result = await this.rawRequest("https://portal.librus.pl/api/v3/SynergiaAccounts", {}, "json");
		} catch (error) {
			console.error(error);
			return;
		}
		this.bearerToken = result.accounts[0].accessToken;
	}

	/**
	 * Login to Librus using your mobile app credentials. Mandatory to run before using anything else.
	 * @param {string} username Your Librus app username (This is NOT your Synergia login e.g. 1234567u !!!)
	 * @param {string} password Your Librus app password
	 */
	async login(username, password) {
		let csrfToken = "";
		let result;
		let resultText;

		// Get csrf-token from <meta> tag for following requests
		try {
			result = await this.rawRequest("https://portal.librus.pl/", {}, "raw");
		} catch (error) {
			console.error(error);
			return;
		}
		if (!result.ok) {
			console.error(`Unexpected response ${result.statusText}`);
			return;
		}
		resultText = await result.text();
		csrfToken = /<meta name="csrf-token" content="(.*)">/g.exec(resultText)[1];

		// Login
		try {
			result = await this.rawRequest("https://portal.librus.pl/rodzina/login/action", {
				method: "POST",
				body: JSON.stringify({
					email: username,
					password: password
				}),
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-TOKEN": csrfToken
				}
			}, "raw");
		} catch (error) {
			console.error(error.message);
			if (error.message === "Unexpected response 403") {
				console.log("Error 403? Very likely wrong login credentials!")
			}
			return;
		}

		// Get the accessToken
		try {
			result = await this.rawRequest("https://portal.librus.pl/api/v3/SynergiaAccounts", {}, "json");
		} catch (error) {
			console.error(error);
			return;
		}
		this.bearerToken = result.accounts[0].accessToken;
	}

	/**
	 * Requests a new pushDevice ID from librus
	 * @returns {number} Optionally return the new pushDevice ID
	 */
	async newPushDevice() {
		let json
		try {
			json = await this.rawRequest("https://api.librus.pl/3.0/ChangeRegister", {
				method: "POST",
				body: JSON.stringify({
					sendPush: 0,
					appVersion: "5.9.0"
				}),
			}, "json");
		} catch (error) {
			console.error(error);
			console.error("Failed to get a new pushDevice; pushDevice unchanged");
			return;
		}
		this.pushDevice = json.ChangeRegister.Id;
		return this.pushDevice;
	}

	/**
	 * Creates a web request using a provided link, method, body and returns the JSON data sent back
	 * @param {string | URL} URL API link
	 * @param {*} options Options object
	 * @param {string} [type="json"] What data should the request return: "json", "text", "raw" - node-fetch Response object. Defaults to "text" to not cause error throws.
	 */
	async rawRequest(URL, options = {}, type = "text") {
		// Merge default request options with user request options - this can be done much better...
		const defaultOptions = {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
				gzip: true,
				Cookie: ((this.cookieJar !== "") ? this.cookieJar : ""),
				Authorization: ((this.bearerToken !== "") ? `Bearer ${this.bearerToken}` : "")
			}
		}
		if ("headers" in options) {
			options.headers = {...defaultOptions.headers, ...options.headers};
		}
		options = { ...defaultOptions, ...options};

		console.log(`\x1b[45m${options.method} ${URL}\x1b[0m`);
		let result;
		try {
			result = await fetch(URL, options);
		} catch (error) {
			console.error("Failed to fetch in rawRequest");
			throw new Error(error);
		}
		if (!result.ok) {
			throw new Error(`Unexpected response ${result.status}`);
			return;
		}

		// Update cookies
		const cookies = [];
		if (result.headers.raw()["set-cookie"]) {
			result.headers.raw()["set-cookie"].forEach(element => {
				cookies.push(element.split(";")[0]);
			});
			this.cookieJar = cookies.join(";");
		}

		if (type === "json") {
			return await result.json();
		} else if (type === "raw") {
			return await result;
		}
		return await result.text();
	}
}

const li = new LibrusClient();
li.login("maciejdziurzynski1@gmail.com", "UmK@@7kA$Q4jYW").then(res => {
	li.newPushDevice().then(res => {
		console.log(res);
	})
})


module.exports = LibrusClient;