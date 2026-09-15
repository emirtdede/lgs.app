---
name: resolve-resource-inventory
description: Resolves approved playlist and MEB sources into exact executable resource items and blocks ambiguous mappings.
---

# Resolve Resource Inventory

Read `docs/30_CURRICULUM_RESOURCE_POLICY.md`, `docs/32_RESOURCE_RESOLUTION_SPEC.md`, `data/resource_sources.json`, the source PDFs and subject roadmaps. Use ordinary public-source/browser research only; do not bypass access controls. Build `data/resolved/resource-items.json` using exact source item IDs/titles/URLs/positions. Map every executable `topic_video` task deterministically. Fixed Math/Turkish sources may not be substituted. Resolve MEB work only to learned-topic-safe official items. Zero-match or multi-match mappings are blocking errors, never guesses. Validate against `contracts/resource-item.schema.json` and add fixtures/tests before allowing plan commit.
