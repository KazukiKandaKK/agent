import { ConfirmationPrompt } from '../ports/confirmationPrompt';
import { RiskLevel } from '../tools/types';

export class PermissionGate {
  constructor(private readonly confirmationPrompt: ConfirmationPrompt) {}

  async canExecute(riskLevel: RiskLevel, description?: string): Promise<boolean> {
    switch (riskLevel) {
      case 'safe':
        return true;
      case 'confirm':
        return this.confirmationPrompt.ask(`Allow ${description || 'this action'}? (y/n) `);
      case 'dangerous':
      default: {
        const allowed = process.env.ALLOW_DANGEROUS === 'true';
        if (!allowed) {
          console.log(`[拒否] Dangerous action denied: ${description || ''}`);
        }
        return allowed;
      }
    }
  }
}
