# infra/

Runtime infrastructure for SPMB JABAR — local-only, not committed.

## Layout

- `pg/data/` — PostgreSQL 16 data directory (created by `pg_ctl initdb`; **do not
  commit**)
- `pg/pgsql/` — portable PostgreSQL 16.9 binaries (downloaded; **do not commit**)
- `pg/server.log` — Postgres server log (runtime noise; ignored via `*.log`)

Only this `README.md` is tracked. Binaries and data are excluded by the root
`.gitignore` (`infra/pg/pgsql/`, `infra/pg/data/`, `*.log`).

## Start Postgres (port 5433)

```bash
infra/pg/pgsql/bin/pg_ctl -D infra/pg/data -l infra/pg/server.log -o "-p 5433" start
infra/pg/pgsql/bin/pg_ctl -D infra/pg/data stop
```

DB `spmb_jabar`, role `spmb` / see `backend/.env`. On a fresh clone, re-create
`data/` with `initdb` (or restore from a dump) and run
`php artisan migrate --seed`.