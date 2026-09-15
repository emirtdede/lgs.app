# 32 — Resource Item Resolution Specification

## Why this exists

The Excel source intentionally stores approved **playlist/source URLs**, not a unique URL for every individual lesson. The application, however, must send the student to the exact lesson/item for a `topic_video` task. Guessing is forbidden.

## Inputs

- `data/resource_sources.json`
- `data/source-playlists/*.pdf` as visual/reference evidence
- the public YouTube/MEB source pages available at implementation time
- subject roadmap + workbook topic/session ordinal

## Required output

Generate a versioned `data/resolved/resource-items.json` validated by `contracts/resource-item.schema.json`. Each item must contain source key, stable external key/video id, exact label/title, exact HTTPS URL, playlist position, optional duration, topic mapping and evidence timestamp/method.

## Deterministic mapping rule

For every executable workbook `Konu Anlatımı` task:

1. identify the approved source key from the workbook/resource policy;
2. enumerate the public source items without bypassing authentication, paywalls or anti-bot controls;
3. match normalized topic/title and the task's session ordinal against source item title/order;
4. require exactly one defensible match;
5. store exact item id/url and evidence;
6. dry-run import fails if match count is zero or greater than one.

The resolver must never replace fixed Math/Turkish playlists. A backup Math source is used only when the canonical plan/resource policy explicitly calls for it; it is not a license to substitute the main source.

## MEB

MEB tasks must resolve to official material covering only learned/completed topics at the scheduled point. A generic page can be stored as a `Resource`, but a required executable `meb_questions` task needs concrete allowed topic(s) and an official item/set. If this cannot be proven, the task remains unresolved and commit is blocked rather than exposing unseen topics.

## Release gate

Before production plan commit:

- unresolved executable video mappings = 0;
- ambiguous mappings = 0;
- required MEB tasks without learned-topic-safe item = 0;
- all exact URLs use allowlisted HTTPS hosts;
- mapping artifact hash is recorded with the import run.
