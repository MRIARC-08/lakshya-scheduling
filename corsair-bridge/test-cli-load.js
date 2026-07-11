const { getCorsairInstance } = require('@corsair-dev/cli/dist/index.js');
async function run() {
  const instance = await getCorsairInstance({ cwd: process.cwd() });
  console.log("Found instance:", Object.keys(instance));
  console.log("Has symbol?", instance[Symbol.for('corsair:internal')] !== undefined);
}
run();
