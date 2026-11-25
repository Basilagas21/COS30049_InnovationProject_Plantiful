# Backend tests

Two kinds of local checks live here.

- `local/run.sh` starts a throwaway PostgreSQL container, applies the schema and consolidated policies, then runs `local/rls_battery.sql`. This checks database access rules without touching the shared Supabase project.
- `local/field-assist.mjs` checks the AI Field Assist migration and access rules against a local PGlite database. It needs no hosted Supabase project.

Run all Python IoT contract tests from the repository root:

```powershell
python -m unittest discover -s iot -p 'test_*.py'
```

The backend directory is gitignored, so these files are part of the local deployment handover rather than the public repository.
