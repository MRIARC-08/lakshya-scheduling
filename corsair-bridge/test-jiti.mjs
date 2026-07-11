import { loadConfig } from 'c12';
async function run() {
  const { config } = await loadConfig({
    configFile: 'src/corsair.ts',
    dotenv: true,
    cwd: process.cwd()
  });
  console.log("Config keys:", Object.keys(config));
  const instance = config.corsair || config.default;
  if (!instance) { console.log("No instance!"); return; }
  console.log("Instance keys:", Object.keys(instance));
  console.log("Symbols:", Object.getOwnPropertySymbols(instance));
  console.log("Has corsair:internal?", !!instance[Symbol.for('corsair:internal')]);
}
run();
