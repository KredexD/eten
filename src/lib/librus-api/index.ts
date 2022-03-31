import nodeFetch, { RequestInit } from "node-fetch";
import "colors";
import { LibrusError } from "./errors/libruserror";
import fetchCookie from "fetch-cookie";
import * as librusApiTypes from "./librus-api-types";

interface ILibrusRequestOptions {
	fetchOptions?: RequestInit
	response?: "text" | "json" | "raw";
	force?: boolean;
}

/**
 * Class for easy interaction with the mobile Librus web API
 * @default
 * @class
 */
export default class LibrusClient {
	private bearerToken: string;
	pushDevice: number;
	private synergiaLogin: string;
	private appUsername: string;
	private appPassword: string;
	private cookieFetch;
	/**
	 * Create a new Librus API client
	 * TODO: Getters/setters? Or maybe a better option to initialize them?
	 * @constructor
	 */
	constructor() {
		this.bearerToken = "";
		this.pushDevice = 0;
		this.synergiaLogin = "";
		this.appUsername = "";
		this.appPassword = "";
		this.cookieFetch = fetchCookie(nodeFetch, new fetchCookie.toughCookie.CookieJar());
	}

	/**
	 * Login to Librus using your mobile app credentials. Mandatory to run before using anything else.
	 * @async
	 * @param username Your Librus app username (This is NOT a Synergia login)
	 * @param password Your Librus app password
	 */
	async login(username: string, password: string): Promise<void> {
		if (username.length < 2 || password.length < 2)
			throw new Error("Invalid username or password");
		// Get csrf-token from <meta> tag for following requests
		const result = await (await this.cookieFetch("https://portal.librus.pl/")).text();
		const csrfTokenRegexResult = /<meta name="csrf-token" content="(.*)">/g.exec(result);
		if (csrfTokenRegexResult == null)
			throw new LibrusError("No csrf-token meta tag in <head> of main site");
		const csrfToken = csrfTokenRegexResult[1];

		// Login
		// Response gives necessary cookies, saved automatically thanks to fetch-cookie
		const loginResult = await this.cookieFetch("https://portal.librus.pl/rodzina/login/action", {
			method: "POST",
			body: JSON.stringify({
				email: username,
				password: password
			}),
			headers: {
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": csrfToken,
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
			}
		});
		if (!loginResult.ok)
			throw new Error(`https://portal.librus.pl/rodzina/login/action ${loginResult.statusText}`);

		// Get the accessToken
		const accountsResult = await (await this.cookieFetch("https://portal.librus.pl/api/v3/SynergiaAccounts", {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
			}
		})).json() as librusApiTypes.APISynergiaAccounts;
		if (!loginResult.ok)
			throw new Error(`https://portal.librus.pl/api/v3/SynergiaAccounts ${loginResult.statusText}`);
		// TODO: Fix the existence checking here
		if (accountsResult.accounts[0]?.accessToken == null)
			throw new LibrusError("SynergiaAccounts endpoint returned no accessToken for account");
		this.bearerToken = accountsResult.accounts[0].accessToken;
		if (accountsResult.accounts[0]?.login == null)
			throw new LibrusError("SynergiaAccounts endpoint returned no login for account");
		this.synergiaLogin = accountsResult.accounts[0].login;
		this.appUsername = username;
		this.appPassword = password;
		console.debug(" Librus Login OK ".bgGreen.white);
		return;
	}

	/**
	 * Uses existing cached cookies instead of credentials to try and get bearer token.
	 * Use only if you're using cookies through constructor or session is expired and you don't want to execute login() function.
	 * @async
	 */
	async refreshToken(): Promise<void> {
		// Get the newer accessToken
		const result = await this.cookieFetch(`https://portal.librus.pl/api/v3/SynergiaAccounts/fresh/${this.synergiaLogin}`,
			{
				method: "GET",
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
				},
				redirect: "manual"
			}
		);
		if (!result.ok)
			throw new LibrusError(`refreshToken: ${result.statusText}`);
		const resultJson = await result.json() as librusApiTypes.APISynergiaAccountsFresh;
		if (resultJson.accessToken == null)
			throw new LibrusError("GET SynergiaAccounts returned unexpected JSON format");
		this.bearerToken = resultJson.accessToken;
		return;
	}

	/**
	 * Creates a request to Librus API using provided link, method, body and returns the JSON data sent back
	 * @async
	 * @param url API endpoit URL
	 * @param options Additional request options
	 */
	async librusRequest(url: string, options?: ILibrusRequestOptions): Promise<string|Response|unknown> {
		// Merge default request options with user request options - this can be done much better...
		let requestOptions: RequestInit = {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
				gzip: "true",
				Authorization: ((this.bearerToken !== "") ? `Bearer ${this.bearerToken}` : "")
			},
			redirect: "manual"
		};
		if (options?.fetchOptions) {
			if ("headers" in options)
				requestOptions.headers = { ...requestOptions.headers, ...options.fetchOptions.headers };
			requestOptions = { ...requestOptions, ...options.fetchOptions };
		}

		// Execute request
		console.debug(`${requestOptions.method} ${url}`.bgMagenta.white);
		let result = await this.cookieFetch(url, requestOptions);
		let resultText = await result.text();

		// Check for correctness
		if (!result.ok) {
			console.debug("Result not OK".bgYellow.white);
			console.debug(`${result.status} ${result.statusText}`.bgYellow.white);
			if (resultText.length) {
				try {
					console.debug(JSON.parse(resultText));
				}
				catch (error) {
					console.debug(resultText);
				}
			}
			if (result.status === 401) {
				console.debug("Trying to refresh token".bgYellow.white);
				try {
					await this.refreshToken();
				}
				catch (error) {
					console.debug(error);
					console.debug("Couldn't refresh token, retrying full login".bgRed.white);
					await this.login(this.appUsername, this.appPassword);
				}
				console.debug("Retrying request after reauthentication".bgYellow.white);
				// This is stupid
				(requestOptions.headers as {[key: string]: string}).Authorization = `Bearer ${this.bearerToken}`;
				console.debug(`${requestOptions.method} ${url}`.bgMagenta.white);
				result = await this.cookieFetch(url, requestOptions);
				if (!result.ok)
					throw new LibrusError(`${result.status} ${result.statusText} after reauth attempt`);
				resultText = await result.text();
			}
		}

		// Return
		if (options.response === "json")
			return JSON.parse(resultText);
		else if (options.response === "text")
			return await result.text();
		else
			return result;
	}

	/**
	 * Requests (and automatically saves internally for future use) a new pushDevice ID from librus
	 * @async
	 * @returns Optionally return the new pushDevice ID
	 */
	async newPushDevice(): Promise<number> {
		const jsonResult = await this.librusRequest("https://api.librus.pl/3.0/ChangeRegister", {
			fetchOptions: {
				method: "POST",
				body: JSON.stringify({
					sendPush: 0,
					appVersion: "6.0.0"
				})
			}
		}) as librusApiTypes.PostAPIChangeRegister;
		// this.pushDevice = jsonResult.ChangeRegister.Id;
		if (jsonResult.ChangeRegister?.Id == null)
			throw new LibrusError("POST ChangeRegister returned unexpected JSON format");
		this.pushDevice = jsonResult.ChangeRegister.Id;
		return this.pushDevice;
	}

	/**
	 * Get changes since last check given our pushDevice
	 *
	 * **NOTE:** To not get repeat changes you have to call the deletePushChanges() method after handling the changes yourself.
	 * @async
	 * @returns {JSON} Response if OK in member (of type array) "Changes" of returned object.
	 */
	async getPushChanges(): Promise<librusApiTypes.APIPushChanges> {
		const resultJson = await this.librusRequest(`https://api.librus.pl/3.0/PushChanges?pushDevice=${this.pushDevice}`, {response: "json"}) as librusApiTypes.APIPushChanges;
		if (!("Changes" in resultJson))
			throw new LibrusError("No \"Changes\" array in received PushChanges JSON");
		// const pushChanges: number[] = [];
		// if (resultJson.Changes.length > 0) {
		// 	for (const element of resultJson.Changes) {
		// 		if (!pushChanges.includes(element.Id))
		// 			pushChanges.push(element.Id);
		// 	}
		// }
		return resultJson;
	}

	/**
	 * Creates one or more DELETE request(s) for all IDs in given array
	 * @async
	 */
	async deletePushChanges(lastPushChanges: number[]): Promise<void> {
		if (!lastPushChanges.length)
			return;
		while (lastPushChanges.length) {
			const delChanges = lastPushChanges.splice(0, 30).join(",");
			await this.librusRequest(`https://api.librus.pl/3.0/PushChanges/${delChanges}?pushDevice=${this.pushDevice}`, {
				fetchOptions: {
					method: "DELETE"
				}
			});
		}
		return;
	}
}