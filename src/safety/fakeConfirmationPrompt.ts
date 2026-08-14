import { ConfirmationPrompt } from '../ports/confirmationPrompt';

export class FakeConfirmationPrompt implements ConfirmationPrompt {
  public asked: string[] = [];

  constructor(private readonly fixedAnswer: boolean) {}

  async ask(message: string): Promise<boolean> {
    this.asked.push(message);
    return this.fixedAnswer;
  }
}
