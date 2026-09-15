# Package Notes

`PACKAGE_MANIFEST.json` contains hashes for the package contents as they existed immediately before the manifest itself was written; therefore it intentionally does not self-hash. Use it to verify included source/data/document files.

The Excel workbook is included unchanged. Two semantic edge cases are normalized during application import, not by mutating the source workbook: Day-1 Math baseline and exact-20 benchmark splitting. See `docs/08_EXCEL_IMPORT_SPEC.md`.

## V2 audited package

V2 incorporates the corrective audit in `docs/33_PACKAGE_AUDIT.md`. The Excel workbook remains byte-for-byte unchanged for source traceability; semantic corrections are explicit import normalizations. `Dashboard` in the workbook is empty and noncanonical. Exact video/MEB item resolution is now a mandatory pre-commit gate rather than an implicit assumption.

## V3 final audited package

V3 closes the remaining V2 packaging and contract gaps: manifest hashes are regenerated after all edits; Antigravity sandbox network access uses an explicit domain allowlist; family ownership is exactly-one at DB commit; student evidence is student-device-only in MVP; benchmark start respects 21:50; and the immutable workbook is paired with a hash-bound N-011 calendar override for 17–18 May 2027.
