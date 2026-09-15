# 20 — Google Antigravity Setup

Research/audit date: **2026-09-13**.

## Model

Use **Gemini 3.8 Flash (High)**. In Antigravity CLI/headless the current stable slug is:

```text
gemini-3.8-flash-high
```

Before a long unattended run, `agy models` must still show this slug; an unknown pinned model must be treated as a blocking setup error rather than silently falling back.

## Workspace context

Keep `AGENTS.md` and `GEMINI.md` at repository root. Antigravity automatically uses workspace context files.

## Skills

Workspace skills live at `.agents/skills/<name>/SKILL.md`. This package intentionally uses Skills, not legacy Workflows. Workflows are deprecated and scheduled for retirement on **2026-11-01**.

## Rules activation

Configure these workspace rules:

| Rule                            | Activation                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `00-core.md`                    | Always On                                                                             |
| `10-domain-invariants.md`       | Always On                                                                             |
| `20-typescript-architecture.md` | Glob: `**/*.{ts,tsx,js,mjs,cjs,json}`                                                 |
| `30-database-security.md`       | Glob: `supabase/**,src/server/**,src/lib/supabase/**`                                 |
| `40-testing-quality.md`         | Glob: `tests/**,e2e/**,**/*.{test,spec}.{ts,tsx},playwright.config.*,vitest.config.*` |
| `50-ui-accessibility.md`        | Glob: `src/app/**,src/components/**,public/**`                                        |
| `60-autonomy-quality-gates.md`  | Always On                                                                             |

Each rule file must remain under Antigravity's 12,000-character rule limit.

## Autonomous permission profile

For this repository use the **sandboxed-autonomy** profile, not unrestricted `always-proceed` terminal execution.

Current Antigravity CLI keys:

```json
{
  "toolPermission": "proceed-in-sandbox",
  "artifactReviewPolicy": "always-proceed",
  "enableTerminalSandbox": true,
  "allowNonWorkspaceAccess": false
}
```

Why:

- `proceed-in-sandbox` automatically executes sandboxed terminal work while still requiring review for execution that would escape containment.
- `artifactReviewPolicy: always-proceed` prevents repetitive code-write review prompts inside this isolated project.
- `allowNonWorkspaceAccess: false` prevents project work from wandering into unrelated user files.

The complete reference fragment is `antigravity/permissions.autonomous-project.json`.

### Permission rules

Allow read-only web research only for the explicit development/source domains in `antigravity/permissions.autonomous-project.json`, plus local app/browser testing:

- package/framework/docs hosts (npm, GitHub, Node, pnpm, Next.js, React, TypeScript, Tailwind, Vitest, Playwright)
- Supabase/Vercel/Cloudflare
- Antigravity/Google, YouTube, MEB/EBA and Diyanet source domains
- `execute_url(localhost)`
- `execute_url(127.0.0.1)`

Do **not** use `read_url(*)`. Sandbox network access is derived from the `read_url` allowlist; an unrestricted wildcard would unnecessarily allow dependency/tool processes to reach arbitrary domains.

Explicitly deny obvious destructive/history/system actions:

- `command(rm -rf)`
- `command(rm -fr)`
- `command(sudo)`
- `command(git clean)`
- `command(git reset --hard)`
- Windows destructive command families: `Remove-Item`, `del`, `rmdir`, `format`, `diskpart`
- `write_file(.git/)`
- `read_file(~/.ssh)`
- `write_file(~/.ssh)`

Do **not** add `unsandboxed(*)` or `execute_url(*)`. Do not use `--dangerously-skip-permissions` for unattended runs.

### IDE vs CLI

The JSON fragment is for `~/.gemini/antigravity-cli/settings.json`. If using the Antigravity desktop/IDE UI, configure the equivalent project settings: sandbox enabled, terminal execution constrained to sandbox, outside-folder access denied, and project-level permissions matching the list above.

## Subagents

Workspace custom agents live under `.agents/agents/<name>/agent.md`; the packaged frontmatter uses supported `model: flash` and `commandExecutionPolicy: sandbox` values.

## Start

1. Verify the model.
2. Apply permissions/rule activation.
3. Open the project root.
4. Paste the full `GOAL_PROMPT.md` as the implementation goal.
5. Do not accept M8 release completion until `scripts/audit-package.py` and all application quality gates pass.
