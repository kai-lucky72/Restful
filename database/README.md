# Database

`fire_extinguisher_db.sql` is a full `pg_dump` (schema + data) of the PostgreSQL database
used by the Fire Extinguisher Management System — all service schemas (`auth`,
`extinguisher`, `inspection`, `notification`) plus seeded demo data.

## Restore

```bash
# 1. Create the database (once)
createdb -U postgres fire_extinguisher_db
#    or in psql:  CREATE DATABASE fire_extinguisher_db;

# 2. Load the dump
psql -U postgres -d fire_extinguisher_db -f database/fire_extinguisher_db.sql
```

## Seeded logins (password in parentheses)
- Admin: `admin@tzw.rw` (Admin123!)
- Inspectors: `inspector1@tzw.rw`, `inspector2@tzw.rw`, `inspector3@tzw.rw` (Inspect123!)
- Clients: `company@tzw.rw`, `school@tzw.rw`, `damas@tzw.rw`, `hotel@tzw.rw` (User123!)

> Passwords are stored only as bcrypt hashes in the dump. Real secrets (JWT, SMTP,
> DB password) live in `.env`, which is gitignored and never committed.
