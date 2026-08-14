import readline from 'readline';
import { createProductionHarness } from './compositionRoot';
import { config } from './config';

async function main(): Promise<void> {
  if (!config.anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill in your key.');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => {
      rl.question(prompt, (answer) => resolve(answer));
    });

  try {
    const userInput = await question('> ');
    const harness = createProductionHarness();
    const result = await harness.run(userInput);
    console.log('\n[結果]');
    console.log(result.output);
    console.log(
      `\n(iterations: ${result.iterations}, stoppedDueToLimit: ${result.stoppedDueToLimit})`
    );
  } finally {
    rl.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
