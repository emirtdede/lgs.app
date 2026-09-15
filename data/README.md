# Data Sources

`LGS_2027_MASTER_PLAN.xlsx` is the planning workbook generated in the planning conversation and included unchanged for traceability. The application's canonical semantics are the workbook **plus** `docs/08_EXCEL_IMPORT_SPEC.md` deterministic normalization rules.

`source-playlists/` contains the captured playlist PDFs used while constructing the curriculum/resource inventory. They are reference inputs, not code and not runtime-served assets.

`resource_sources.json` is the canonical approved-source catalog used by the resolver. It is not an exact-video inventory. Exact executable items must be generated and validated according to `docs/32_RESOURCE_RESOLUTION_SPEC.md` before plan commit.

The workbook's `Dashboard` sheet is empty and intentionally ignored by application import.

## Calendar overrides

`calendar_overrides.json` is a small, source-cited, hash-bound correction layer for verified availability facts that were not represented in the immutable workbook snapshot. It currently marks 17–18 May 2027 as full-day availability for Kurban Bayramı. It must never alter curriculum/topic order.
