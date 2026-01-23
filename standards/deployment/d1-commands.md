# D1 command memo

D1 uses SQLite-compatible SQL. Use the same SQL syntax you would run against SQLite, but execute it through Wrangler or the Cloudflare console.

## Using Wrangler (CLI)

Examples (replace `<db-name>` with your D1 database name, such as `interdead_core`):

```bash
npx wrangler d1 execute <db-name> --command "SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name;"
npx wrangler d1 execute <db-name> --command "SELECT * FROM profiles ORDER BY profile_id LIMIT 20;"
npx wrangler d1 execute <db-name> --command "DELETE FROM efbd_scale WHERE profile_id = 'demo-profile';"
```

## Using the Cloudflare console (web UI)

Run the same SQL in the D1 Console Query editor:

```sql
SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name;
SELECT * FROM efbd_scale ORDER BY updated_at DESC LIMIT 20;
DELETE FROM profiles WHERE profile_id = 'demo-profile';
```

## Notes

- Prefer `SELECT ... LIMIT` for quick inspection.
- Always verify the active environment (staging vs production) before deleting data.
