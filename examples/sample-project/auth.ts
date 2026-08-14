export function checkLogin(password: string): boolean {
  // BUG: the condition is inverted. It should let the correct password in.
  if (password !== 'secret') {
    return true;
  }
  return false;
}
