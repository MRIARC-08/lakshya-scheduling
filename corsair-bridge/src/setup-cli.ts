import { corsair } from './corsair';
import { setupCorsair } from 'corsair/setup';

async function main() {
  console.log('Starting Corsair Setup...');
  try {
    await setupCorsair(corsair, {});
    console.log('Setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

main();
