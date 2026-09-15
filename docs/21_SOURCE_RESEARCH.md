# 21 — Source Research and Technical Basis

Research date: **2026-09-13**. These links are references for the decisions in this package; they are not runtime dependencies.

## Google Antigravity

- Skills: https://www.antigravity.google/docs/ide/skills/
  - modern workspace path `.agents/skills/<skill>/SKILL.md`
  - YAML frontmatter and progressive disclosure.
- Rules: https://antigravity.google/docs/rules-workflows
  - workspace path `.agents/rules`
  - activation modes include Always On, Model Decision, Glob, Manual
  - individual rule limit 12,000 characters.
- Workflows migration: https://antigravity.google/docs/migration/workflows-to-skills
  - workflows deprecated in favor of Skills by Nov 1, 2026.
- Permissions: https://antigravity.google/docs/permissions
  - Deny > Ask > Allow precedence; action(target) syntax; workspace reads/writes auto-allowed.
- CLI settings: https://antigravity.google/docs/cli/settings
  - `toolPermission`, `artifactReviewPolicy`, `enableTerminalSandbox`, `allowNonWorkspaceAccess`.
- Terminal sandbox: https://antigravity.google/docs/cli/sandbox
  - `proceed-in-sandbox` is the selected autonomous terminal profile.
- Best practices: https://www.antigravity.google/docs/cli/best-practices/
  - verification loops; AGENTS.md/GEMINI.md workspace context.
- Subagents: https://antigravity.google/docs/subagents
  - `.agents/agents/`, YAML custom subagents, inheritance.
- Headless/model slugs: https://antigravity.google/docs/cli/headless
  - `gemini-3.8-flash-high` = Gemini 3.8 Flash (High).

## Web stack

- Next.js security/current releases: https://nextjs.org/blog
  - Aug 25 2026 security release recommends 16.3.3 Active LTS or 15.5.24 Maintenance LTS.
- Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Node release status: https://nodejs.org/en/about/previous-releases
  - Node 24 is LTS as of research date.
- React 19.3 release: https://react.dev/blog/2026/09/09/react-19-3
- React npm: https://www.npmjs.com/package/react
  - `19.3.0` is current stable at audit time and is the package baseline.
- TypeScript 6.0: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html

## Supabase

- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
  - grants + policies both matter; service secret bypasses RLS and stays server-side.
- Anonymous auth: https://supabase.com/docs/guides/auth/auth-anonymous
  - anonymous users are authenticated role and JWT includes `is_anonymous`; dynamic rendering recommended with Next.js.
- SSR auth: https://supabase.com/docs/guides/auth/server-side
- Migrations: https://supabase.com/docs/guides/local-development/database-migrations
- Local workflow: https://supabase.com/docs/guides/local-development/cli-workflows
- Production checklist/CAPTCHA: https://supabase.com/docs/guides/deployment/going-into-prod
- Backups: https://supabase.com/docs/guides/platform/backups
  - Pro/Team/Enterprise managed daily backups; Free should export logical backups with CLI.

## Security/accessibility

- OWASP ASVS: https://owasp.org/projects/asvs
  - stable 5.0.0 referenced for application verification discipline.
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
  - W3C Recommendation; project targets Level AA.

## LGS date

As of the research date, this package does **not** claim `2027-06-13` is the official LGS 2027 exam date. It remains the workbook's final planning anchor until MEB publishes the official date. The application must make the final window adjustable by owner/admin without rewriting historical completions.

## 2026-09-13 final verification additions

- Antigravity permissions/sandbox: https://antigravity.google/docs/permissions and https://antigravity.google/docs/cli/sandbox/ — `proceed-in-sandbox`, Deny > Ask > Allow, domain-based sandbox network allowlisting.
- Antigravity Skills: https://www.antigravity.google/docs/ide/skills/ — workspace path `.agents/skills/<name>/SKILL.md`.
- Antigravity custom agents: https://www.antigravity.google/docs/subagents/ — workspace `.agents/agents/...`, `model: flash`, `commandExecutionPolicy: sandbox`.
- Antigravity headless model list: https://www.antigravity.google/docs/cli/headless/ — `gemini-3.8-flash-high`.
- React 19.3: https://react.dev/blog/2026/09/09/react-19-3 and https://react.dev/versions.
- Next.js August 2026 security release: https://nextjs.org/blog — 16.3.3 Active LTS security baseline.
- Node 24 LTS release line: https://nodejs.org/en/blog/release.
- MEB 2026–2027 school calendar: https://meb.gov.tr/2026-2027-egitim-ogretim-yili-takvimi-aciklandi/haber/41057/tr.
- Diyanet 2027 official holidays: https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=159 — 17–18 May 2027 are Kurban Bayramı full public holidays.
