const { loadConfig } = require('@corsair-dev/cli/node_modules/c12');
async function run() {
  try {
    await loadConfig({ configFile: 'src/corsair.ts', cwd: process.cwd() });
    console.log("Success");
  } catch (e) { console.error(e); }
}
run();
