# Workflows not enabled yet

These run the daily updates (world index, news, link checks, AI maintenance, contributions) and the full rebuild of the
site. None of them has run on GitHub yet, and the full rebuild still depends on data that exists only on the
maintainer's machine. They are enabled one at a time by moving them back to `.github/workflows/` after a manual
`workflow_dispatch` test. Until then the site is deployed from the committed build in `web/` by `deploy-site.yml`.
