"use strict";

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const config = require("./config.json");
const cookiejar = require('cookiejar');
const fs = require("fs");
const colors = require("colors");

const warnPrefix = "WARNING".bgYellow.gray + " ";
const errorPrefix = "ERROR".bgRed.white + " ";
const infoPrefix = "INFO".bgWhite.black + " ";

// TODO:
// - Sensible console logging with loglevels?
// - Change error handling to have to be done by the user?
// - Proper cookie handling?
// - Implement all endpoints?

class LibrusClient {
	/**
	 * @constructor Create a new Librus mobile API client (API version 3)
	 */
	constructor() {
		this.bearerToken = "";
		this.pushDevice = 0;
		this.cookieJar = "";
		this.cachePath = "./librusCache.json"
        this.lastPushChanges = ""
	}

	/**
	 * Uses existing cached cookies instead of credentials to try and get bearer token.
	 * Use only if you're using cookies through constructor or session is expired and you don't want to execute login() function.
	 * @async
	 * @returns {Boolean} True if success, False otherwise.
	 */
	async relogin() {
		// Get the newer accessToken
		let result;
		try {
			result = await this.rawRequest("https://portal.librus.pl/api/v3/SynergiaAccounts", {}, "json");
		} catch (error) {
			console.error(errorPrefix + "Failed to relogin with currently given cookies. Consider new login.");
			console.error(error);
			return false;
		}
		this.bearerToken = result.accounts[0].accessToken;
		return true;
	}

	/**
	 * Login to Librus using your mobile app credentials. Mandatory to run before using anything else.
	 * @param {string} username Your Librus app username (This is NOT your Synergia login e.g. 1234567u !!!)
	 * @param {string} password Your Librus app password
	 * @async
	 */
	async login(username, password) {
		let csrfToken = "";
		let result;
		let resultText;

		// Get csrf-token from <meta> tag for following requests
		try {
			result = await this.rawRequest("https://portal.librus.pl/", {}, "raw");
		} catch (error) {
			console.error(errorPrefix + error);
			return;
		}
		if (!result.ok) {
			console.error(errorPrefix + `Unexpected response ${result.statusText}`);
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
			console.error(errorPrefix + error);
			console.error(error);
			if (error.message === "Unexpected response 403") {
				console.info(infoPrefix + "403? Very likely wrong login credentials!")
			}
			return;
		}

		// Get the accessToken
		try {
			result = await this.rawRequest("https://portal.librus.pl/api/v3/SynergiaAccounts", {}, "json");
		} catch (error) {
			console.error(errorPrefix + error);
			console.error(error);
			return;
		}
		this.bearerToken = result.accounts[0].accessToken;
	}

	/**
	 * Requests (and automatically saves internally for future use) a new pushDevice ID from librus
	 * @async
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
			console.error(errorPrefix + error);
			console.error(error);
			console.error(errorPrefix + "Failed to get a new pushDevice; pushDevice unchanged");
			return;
		}
		this.pushDevice = json.ChangeRegister.Id;
		return this.pushDevice;
	}

	/**
	 * Creates a request to Librus API using provided link, method, body and returns the JSON data sent back
	 * @async
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
			options.headers = {...defaultOptions.headers, ...options.headers };
		}
		options = {...defaultOptions, ...options};

		console.info(`${options.method} ${URL}`.bgMagenta.white);
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

	/**
	 * Caches credentials (cookies, pushDevice, bearer token) to a local file for convenience
	 * @param {string} [path=]
	 */
	cacheCredentials(path = this.cachePath) {
		const obj = JSON.stringify({
			cookieJar: this.cookieJar,
			pushDevice: this.pushDevice,
			bearerToken: this.bearerToken
		});
		fs.writeFileSync(path, obj);
	}

	/**
	 * Loads cached credentials
	 * @param {string} [path=]
	 */
	loadCachedCredentials(path = this.cachePath) {
		if (fs.existsSync(path)) {
			const contents = fs.readFileSync(path);
			const json = JSON.parse(contents);
			if ("cookieJar" in json && typeof json.cookieJar === "string" && json.cookieJar.length !== 0) {
				this.cookieJar = json.cookieJar;
			}
			if ("pushDevice" in json && typeof json.pushDevice === "number" && json.pushDevice) {
				this.pushDevice = json.pushDevice;
			}
			if ("bearerToken" in json && typeof json.bearerToken === "string" && json.bearerToken.length !== 0) {
				this.bearerToken = json.bearerToken;
			}
		} else {
			console.error(errorPrefix + "No cached credentials!")
			console.info(infoPrefix + "Thus please execute LibrusClient.login() followed by LibrusClient.newPushDevice()");
			console.info(infoPrefix + "or assign both/either values manually".yellow);
		}
	}

	/**
	 * Get changes since last check given our pushDevice
	 * @async
	 * @returns {JSON} Response if OK in member (of type array) "Changes" of returned object.
	 */
	async getPushChanges() {
		let result;
		try {
			result = await this.rawRequest(`https://api.librus.pl/2.0/PushChanges?pushDevice=${this.pushDevice}`, {}, "raw");
		} catch (error) {
			console.error(errorPrefix + "getPushChanges failed");
			console.error(error);
			return;
		}
        const resultJson = await result.json();
        if ("Changes" in resultJson && resultJson.Changes.length > 0) {
            const tempChangesArr = [];
            resultJson.Changes.forEach(element => {
                tempChangesArr.push(element.Id);
            })
            this.lastPushChanges = tempChangesArr.join(",");
        }
		return resultJson;
	}

    /**
     * Creates a DELETE request for all elements from the last getPushChanges
     * UNTESTED
     * @async
     */
    async deletePushChanges() {
        if (this.lastPushChanges === "") {
            console.warn(infoPrefix + "this.lastPushChanges is empty!");
            return;
        }
        let result;
        try {
            result = await this.rawRequest(`https://api.librus.pl/2.0/PushChanges/${this.lastPushChanges}?pushDevice=${this.pushDevice}`, {method: "DELETE"}, "raw");
        } catch (error) {
            console.error(errorPrefix + "deletePushChanges failed - ASK METEN TO INVESTIGATE!");
			console.error(error);
			return;
        }
    }
}

module.exports = LibrusClient;