const { createRequire } = require('module');
const req = createRequire(process.cwd() + '/node_modules/@corsair-dev/cli/package.json');
const cli = req('./dist/index.js');
async function run() {
  try {
    const inst = await cli.getCorsairInstance({ cwd: process.cwd() });
    console.log("Keys:", Object.keys(inst));
    console.log("Has symbol:", !!inst[Symbol.for('corsair:internal')]);
  } catch (e) { console.error(e); }
}
run();
