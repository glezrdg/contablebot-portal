# Development Scripts

This directory contains utility scripts for development and database management.

## Quick Reference

```bash
# Create a user
npm run create-user -- --email user@test.com --password pass123 --firm-id 1

# List all users
npm run list-users

# List users for a specific firm
npm run list-users -- --firm-id 1
```

## create-user.ts

Creates users directly in the database for development and testing purposes.

### Prerequisites

- `.env.local` file with `POSTGREST_BASE_URL` configured
- Database accessible via PostgREST

### Usage

#### Create a user for an existing firm

```bash
npm run create-user -- --email user@example.com --password mypass123 --firm-id 1
```

#### Create an admin user

```bash
npm run create-user -- --email admin@example.com --password admin123 --firm-id 1 --role admin
```

#### Create a user with full name

```bash
npm run create-user -- --email john@example.com --password pass123 --firm-id 1 --full-name "John Doe"
```

#### Create a new firm and user together

```bash
npm run create-user -- --email owner@newcompany.com --password secure123 --firm-name "New Company Inc" --create-firm
```

### Options

| Option | Description | Required |
|--------|-------------|----------|
| `--email` | User email address | Yes |
| `--password` | User password (min 6 chars) | Yes |
| `--firm-id` | ID of existing firm | Yes (unless `--create-firm`) |
| `--firm-name` | Name for new firm | Yes (if `--create-firm`) |
| `--create-firm` | Create a new firm | No |
| `--role` | User role: `admin` or `user` | No (default: `user`) |
| `--full-name` | User's full name | No |

### Examples

**1. Quick dev setup - create firm and admin user:**
```bash
npm run create-user -- \
  --email dev@test.com \
  --password dev123 \
  --firm-name "Test Company" \
  --create-firm \
  --role admin \
  --full-name "Dev Admin"
```

**2. Add a regular user to existing firm:**
```bash
npm run create-user -- \
  --email user@test.com \
  --password user123 \
  --firm-id 1
```

**3. Add an accountant to firm #5:**
```bash
npm run create-user -- \
  --email accountant@firm.com \
  --password secure456 \
  --firm-id 5 \
  --full-name "María González"
```

### Notes

- Passwords are hashed using bcrypt before storage
- Email addresses are automatically lowercased and trimmed
- When creating a firm, a dev license key is auto-generated
- New firms default to 10,000 invoice limit (dev setting)
- Created users are active by default
- Regular users need client assignments via the admin UI to access invoices

### Troubleshooting

**Error: POSTGREST_BASE_URL not configured**
- Make sure `.env.local` exists and has `POSTGREST_BASE_URL` set

**Error: Failed to create user (409)**
- User with that email already exists in the firm

**Error: Failed to create user (foreign key violation)**
- The specified `firm-id` doesn't exist in the database

**Error: Password must be at least 6 characters**
- Use a longer password

---

## list-users.ts

Lists users in the database with their details and firm information.

### Prerequisites

- `.env.local` file with `POSTGREST_BASE_URL` configured
- Database accessible via PostgREST

### Usage

#### List all users

```bash
npm run list-users
```

#### List users for a specific firm

```bash
npm run list-users -- --firm-id 1
```

#### Search users by email

```bash
npm run list-users -- --email john
```

#### List only admin users

```bash
npm run list-users -- --role admin
```

#### Combine filters

```bash
npm run list-users -- --firm-id 1 --role user
```

### Options

| Option | Description | Required |
|--------|-------------|----------|
| `--firm-id` | Filter by firm ID | No |
| `--email` | Filter by email (partial match) | No |
| `--role` | Filter by role: `admin` or `user` | No |

### Output Example

```
Found 3 users:

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ID    Email                         Full Name                Role    Firm                     Active  Created
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
5     admin@test.com                Admin User               admin   Test Company             ✓       1/15/2026
4     user@test.com                 John Doe                 user    Test Company             ✓       1/15/2026
3     accountant@firm.com           María González           user    Accounting Firm LLC      ✓       1/14/2026
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
```

### Notes

- Users are sorted by creation date (newest first)
- Email search is case-insensitive and matches partial strings
- Active status shows ✓ for active users and ✗ for inactive users
