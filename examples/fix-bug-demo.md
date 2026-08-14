# Bug-fix demo

This demo uses the harness to fix a one-line bug in `sample-project/auth.ts`. The bug is an inverted `if` condition: it currently returns `true` for every password except the correct one.

> This log was produced with a `FakeLlmClient` so the flow can be verified without an Anthropic API key. With `ANTHROPIC_API_KEY` set, `npm run start` (or the same loop wired to `AnthropicLlmClient`) will perform the same steps using Claude.

## Command

```bash
npx tsx examples/run-fake-demo.ts
```

## Sample file before (`examples/sample-project/auth.ts`)

```typescript
export function checkLogin(password: string): boolean {
  // BUG: the condition is inverted. It should let the correct password in.
  if (password !== 'secret') {
    return true;
  }
  return false;
}
```

## Transcript

```
[思考] 1: tools: bash
[行動] bash: {"command":"grep -n \"password\" auth.ts"}
[観察] bash: 1:export function checkLogin(password: string): boolean {
2:  // BUG: the condition is inverted. It should let the correct password in.
3:  if (password !== 'secret') {

[思考] 2: tools: read_file
[行動] read_file: {"path":"auth.ts"}
[観察] read_file: export function checkLogin(password: string): boolean {
  // BUG: the condition is inverted. It should let the correct password in.
  if (password !== 'secret') {
    return true;
  }
  return false;

[思考] 3: tools: edit_file
[行動] edit_file: {"path":"auth.ts","old_string":"  if (password !== 'secret') {","new_string":"  if (password === 'secret') {"}
[観察] edit_file: Edited auth.ts

[思考] 4: Fixed the inverted condition in auth.ts. The function now returns true only when the password is 'secret'.

[結果]
Fixed the inverted condition in auth.ts. The function now returns true only when the password is 'secret'.

(iterations: 4, stoppedDueToLimit: false)
```

## Result

The `if` condition was changed from `password !== 'secret'` to `password === 'secret'`, so the login check now behaves correctly.
