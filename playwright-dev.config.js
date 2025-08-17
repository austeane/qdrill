/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
	webServer: {
		command: 'echo "Using existing dev server"',
		port: 3000,
		reuseExistingServer: true
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	use: {
		baseURL: 'http://localhost:3000'
	}
};

// Allow bypassing webServer spawn if a server is already running
if (process.env.PW_NO_WEBSERVER) {
  // @ts-ignore
  delete config.webServer;
}

export default config;
