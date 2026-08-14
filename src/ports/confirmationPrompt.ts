export interface ConfirmationPrompt {
  ask(message: string): Promise<boolean>;
}
