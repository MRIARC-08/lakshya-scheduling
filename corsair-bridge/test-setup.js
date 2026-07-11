const { createRequire } = require('module');
const req = createRequire(process.cwd() + '/node_modules/@corsair-dev/cli/package.json');
const cli = req('./dist/index.js');
const { setupCorsair } = require('corsair/setup');
async function run() {
  try {
    const inst = await cli.getCorsairInstance({ cwd: process.cwd() });
    console.log("Calling setupCorsair...");
    await setupCorsair(inst, { caller: 'cli' });
    console.log("Success!");
  } catch (e) { console.error(e); }
}
run();
