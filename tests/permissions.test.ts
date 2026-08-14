import { PermissionGate } from '../src/safety/permissions';
import { FakeConfirmationPrompt } from '../src/safety/fakeConfirmationPrompt';

describe('PermissionGate', () => {
  afterEach(() => {
    delete process.env.ALLOW_DANGEROUS;
  });

  it('allows safe actions without prompting', async () => {
    const prompt = new FakeConfirmationPrompt(false);
    const gate = new PermissionGate(prompt);

    const allowed = await gate.canExecute('safe');

    expect(allowed).toBe(true);
    expect(prompt.asked).toHaveLength(0);
  });

  it('asks for confirmation on confirm actions and returns the answer', async () => {
    const prompt = new FakeConfirmationPrompt(true);
    const gate = new PermissionGate(prompt);

    const allowed = await gate.canExecute('confirm', 'write_file');

    expect(allowed).toBe(true);
    expect(prompt.asked).toContain('Allow write_file? (y/n) ');
  });

  it('denies confirm actions when the user says no', async () => {
    const prompt = new FakeConfirmationPrompt(false);
    const gate = new PermissionGate(prompt);

    const allowed = await gate.canExecute('confirm', 'write_file');

    expect(allowed).toBe(false);
  });

  it('denies dangerous actions by default', async () => {
    process.env.ALLOW_DANGEROUS = 'false';
    const gate = new PermissionGate(new FakeConfirmationPrompt(true));

    const allowed = await gate.canExecute('dangerous', 'rm -rf');

    expect(allowed).toBe(false);
  });

  it('allows dangerous actions when explicitly permitted', async () => {
    process.env.ALLOW_DANGEROUS = 'true';
    const gate = new PermissionGate(new FakeConfirmationPrompt(false));

    const allowed = await gate.canExecute('dangerous', 'rm -rf');

    expect(allowed).toBe(true);
  });
});
