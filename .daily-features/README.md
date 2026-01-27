# Daily Features (automation)

This folder is used by the automated “daily feature ideator → builder” workflow.

## Files
- `YYYY-MM-DD--<slug>.md`: a proposed feature spec for that day.
  - Status lives in the file header.
  - Once approved, the builder agent implements it on branch `claudio` and commits only after `npm test` passes.

## Status values
- `PROPOSED` (ideator created; waiting for approval)
- `APPROVED` (approved by Fede)
- `IMPLEMENTED` (merged/committed on `claudio`)
- `SKIPPED`

## Note
`/home/ubuntu/clawd/inbox/` is transient; long-lived work should stay under `/home/ubuntu/clawd/projects/`.
