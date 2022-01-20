"use strict";

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const config = require("./config.json");

// TODO:
//  1) Funkcja private na webrequesty po prostu
//  2) Coś na zarządzanie ciasteczkami (i ciasteczka w konstruktorze na relogin?)

class LibrusClient {
	/**
	 * @constructor Create a new Librus mobile API client (API version 3)
	 */
	constructor() {
		this.bearerToken = '';
		this.pushDevice = -1;
	}

	/**
	 * Login to Librus using your mobile app credentials. Mandatory to run before using anything else.
	 * @param {string} username Your Librus app username (This is NOT your Synergia login e.g. 1234567u !!!)
	 * @param {string} password Your Librus app password
	 */
	async function login(username, password) {
		let cookies = [];
		let cookiesHeader = "";
		let csrfToken = "";
		let result;
		let resultText;

		// Get csrf-token from <meta> tag for future use
		console.log("\x1b[45mGET https://portal.librus.pl/\x1b[0m");
		try {
			result = await fetch("https://portal.librus.pl/", {
				method: "GET",
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
				}
			});
		} catch (error) {
			throw new Error(error);
		}
		if (!result.ok) {
			throw new Error("Unexpected response ${portalResult.statusText}");
		}

		resultText = await result.text();
		csrfToken = /<meta name="csrf-token" content="(.*)">/g.exec(resultText)[1];

		result.headers.raw()["set-cookie"].forEach(element => {
			cookies.push(element.split(";")[0]);
		});
		cookiesHeader = cookies.join("; ");

		// Login
		console.log("\x1b[45mPOST https://portal.librus.pl/rodzina/login/action\x1b[0m");
		try {
			result = await fetch("https://portal.librus.pl/rodzina/login/action", {
				method: "POST",
				body: JSON.stringify({
					email: username,
					password: password
				}),
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
					"X-CSRF-TOKEN": csrfToken,
					Cookie: cookiesHeader
				}
			});
		} catch (error) {
			throw new Error(error);
		}
		if (!result.status === 403) {
			throw new Error(`Response ${result.status} - probably invalid login.`);
		} else if (!result.ok) {
			throw new Error(`Unexpected response ${result.status}`);
		}

		cookies = [];
		result.headers.raw()["set-cookie"].forEach(element => {
			cookies.push(element.split(";")[0]);
		});
		cookiesHeader = cookies.join("; ");

		// Get the accessToken
		console.log("\x1b[45mGET https://portal.librus.pl/api/v3/SynergiaAccounts\x1b[0m");
		try {
			result = await fetch("https://portal.librus.pl/api/v3/SynergiaAccounts", {
				method: "GET",
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
					Cookie: cookiesHeader
				}
			});
		} catch (error) {
			throw new Error(error);
		}
		if (!result.ok) {
			throw new Error(`Unexpected response ${result.status}`);
		}
		this.bearerToken = (JSON.parse(await result.text())).accounts[0].accessToken;
	}

	/**
	 * Requests a new pushDevice ID from librus
	 * @param {string} authToken The authorization token given by LibrusClient.login() 
	 * @returns {number} Optionally return the new pushDevice ID
	 */
	async function newPushDevice(authToken) {
		let result;
		console.log("\x1b[45mPOST https://api.librus.pl/3.0/ChangeRegister\x1b[0m");
		try {
			result = await fetch("https://api.librus.pl/3.0/ChangeRegister", {
				method: "POST",
				body: JSON.stringify({
					sendPush: 0,
					appVersion: "5.9.0"
				}),
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
					Authorization: `Bearer ${authToken}`
				}
			});
		} catch (error) {
			throw new Error(error);
		}
		if (!result.ok) {
			throw new Error(`Unexpected response ${result.status}`);
		}
		this.pushDevice = (JSON.parse(await result.text())).ChangeRegister.Id;
		return this.pushDevice;
	}

    /**
     * Creates a web request using a provided link, method, body and returns the data sent back
     * @param {string} URI API link
     * @param {string} method HTTP Method (Default: "GET")
     * @param {string} headers Additional HTTP Headers
     * @param {string} body Body for POST requests
     */
    async function rawRequest(URI, method = "GET", headers = "", body = "") {

    }
}

module.exports = LibrusClient;