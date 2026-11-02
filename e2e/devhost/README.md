# End-to-end tests against a real pool

These tests drive the REST API of a running orchestrator connected to at least one pool (XCP-ng 8.3 for
now). They create a small VM, a cloud-init template, a tag and a backup job, and remove them at the end.

```
node --test e2e/devhost/
```

Environment:

| Variable | Default | |
|---|---|---|
| `FRAGATA_URL` | `http://localhost:8080` | the orchestrator |
| `FRAGATA_USER` / `FRAGATA_PASSWORD` | `admin@admin.net` / `admin` | an administrator |
| `FRAGATA_BACKUP_REPOSITORY` | | id of a backup repository; the backup tests are skipped without it |

The first pool returned by the API is used, with its shared SR when there is one.
