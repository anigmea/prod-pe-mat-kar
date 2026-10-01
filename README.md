# prod-pe-mat-kar

Bhai, that is production.

An explicit-config pre-command gate. No AI, network or runtime dependencies. It evaluates your declared environment/hostname rules and exits nonzero on a protected target. It NEVER executes the command you are trying to guard.

Status: unpublished 0.1.0 candidate. Node 18+, ESM. Not a security boundary.

## Reviewed checkout

```sh
npm ci
npm test
node src/cli.js --help
```

After publication: `npx prod-pe-mat-kar --config guard.json`.

## Explicit rules

```json
{
  "version": 1,
  "rules": [
    { "label": "production", "env": { "APP_ENV": "production" } },
    { "label": "prod-host", "hosts": ["your-exact-production-hostname"] }
  ]
}
```

Environment conditions and hosts inside one rule are AND. Separate rules are OR. Comparisons are exact and case-sensitive; no regex, substrings, URLs, DNS checks or guessing. Every referenced environment key must be present and nonempty, even in an otherwise nonmatching rule. Missing input or invalid config fails closed.

Use nonsecret environment indicators. Do not put database passwords/URLs, API keys or other secrets in this file. Returned results include labels, not matched environment values.

```sh
# Set the intended env in your own shell BEFORE both checks and command.
export APP_ENV=development
node src/cli.js --config guard.json && npm run your-command
```

For npm scripts, put the gate before the real command with `&&`, not `;`. The gate sees only its process environment and OS hostname. It does NOT know what a later command's flags, config files, container, SSH session, .env loader or different environment will target. If those differ, the guard may permit a dangerous command. A clean development label is not evidence the actual target is safe.

Protected match:

```text
Bhai, that is production (production). Gate blocked.
Review the target, then supply --override with: I UNDERSTAND production
```

Override is explicit:

```sh
node src/cli.js --config guard.json --override 'I UNDERSTAND production'
```

It is a phrase argument, not interactive TTY verification. Someone can automate it. The tool deliberately cannot promise that the person typing has reviewed the target. No override or downstream command runs automatically.

## API and exits

`evaluate(config, {env, host, override})` returns `allowed`, `matchedRules`, `overrideRequired`, `reason`. Omitting env/host uses the current process env and OS hostname.

- 0: no protected rule matched or exact override supplied.
- 2: protected rule matched, no valid override.
- 1: missing/malformed config, missing required env or bad CLI input.

`--json` prints the result. Config version 1, max 100 rules, 32 env conditions/hosts per rule, CLI file max 64 KiB. Labels must be unique.

## Limits and competition

No detection of destructive command syntax, cloud account, remote deployment target or hidden production state. It does not prevent bypass by removing the gate. Use actual access controls, scoped credentials, backups and review for production changes.

SafeExec and molly-guard already offer confirmation gates. This package's narrower bet is explicit npm-script environment/host contracts, not inventing command safety. Tests are synthetic and do not prove your config is correct. Review it yourself.

## Release

`npm publish --access public` runs the offline tests. No merge or publish until owner review. Source is the runtime format; tests/config/secrets are excluded from the npm archive. MIT.
