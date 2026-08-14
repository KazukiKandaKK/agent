import readline from 'readline';
import { ConfirmationPrompt } from '../ports/confirmationPrompt';

export class CliConfirmationPrompt implements ConfirmationPrompt {
  async ask(message: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(message, (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase().startsWith('y'));
      });
    });
  }
}
