const LibrusClient = require("./librus.js")
// 6234034

async function func() {
	const li = new LibrusClient();
	li.loadCachedCredentials();
	if ( !( await li.relogin() ) ) {
		await li.login("login", "pass");
	}
	if (!li.pushDevice) {
		await li.newPushDevice();
	}
	li.cacheCredentials();

	// Now for your real logic
	const res = await li.getPushChanges();
	if (!res) {
		console.log("Fucked")
	} else {
		console.log(res);
	}
	await li.deletePushChanges();
}

func();