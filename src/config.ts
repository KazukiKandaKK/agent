import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Verify available model IDs in the Anthropic SDK docs/node_modules before deploying.
// The default here is a representative modern Claude model as of the project date.
export const DEFAULT_MODEL = 'claude-sonnet-4-6';

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
  maxTokens: parseInt(process.env.MAX_TOKENS ?? '4096', 10),
  maxIterations: parseInt(process.env.MAX_ITERATIONS ?? '25', 10),
  workingDir: process.env.WORKING_DIR ? path.resolve(process.env.WORKING_DIR) : process.cwd(),
  allowDangerous: process.env.ALLOW_DANGEROUS === 'true',
};
