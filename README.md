# omp-openai-quota

OMP statusline extension showing live OpenAI Codex quota: Codex weekly and banked resets with the nearest expiry.

    OpenAI │ ↻ Codex 7d 70% · 3d 2h │ ◆ Banked resets 2 · 16d

For Claude subscription quota, see [zznabil/omp-anthropic-quota](https://github.com/zznabil/omp-anthropic-quota).

## Install

Requires OMP with an authenticated `openai-codex` provider. Copy the extension, then restart OMP:

    mkdir -p ~/.omp/agent/extensions
    cp agent/extensions/openai-weekly-quota.ts ~/.omp/agent/extensions/

## Behaviour

- Runs `omp usage --provider openai-codex --json` (10 s timeout) on session start, after each turn and every 5 minutes.
- Colour: green above 25% remaining, yellow at 25% or below, red at 10% or below.
- Missing values show `—`; a failed usage check shows `OpenAI quota unavailable`.
- Uses status key `openai-weekly-quota`.

## Test

    bun test agent/extensions/openai-weekly-quota.test.ts

## History

Spark limits were removed after OpenAI deprecated Spark. Earlier versions also bundled OMP defaults, Semble, and a pinned Ponytail installer. These were removed; see git history before the "reduce to OpenAI quota extension" commit.
