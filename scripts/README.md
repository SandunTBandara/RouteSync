# Database Seeding Scripts

This directory contains scripts to populate your development database with test data.

## Available Scripts

### User Seeding

```bash
pnpm run seed:users
```

Creates test admin and user accounts:

- **Admin**: testadmin@busroute.com / admin123
- **User**: testuser@busroute.com / user123
- Additional test users: johndoe, janesmith

### Bus Data Seeding

```bash
pnpm run seed:buses
```

Creates bus and route data for testing the bus tracking functionality.

### All Seeding Commands

```bash
# Individual seeding (run in order)
pnpm run seed:users   # Users only
pnpm run seed:routes  # Routes only (required before buses)
pnpm run seed:buses   # Buses only

# Information about all seeding
pnpm run seed         # Shows available commands and credentials
```

## Prerequisites

- MongoDB server running on localhost:27017
- Database name: `bus-route-api`

## Test Credentials

### Admin Account

- **Username**: testadmin
- **Email**: testadmin@busroute.com
- **Password**: admin123
- **Role**: admin

### Regular User Account

- **Username**: testuser
- **Email**: testuser@busroute.com
- **Password**: user123
- **Role**: user

## Usage Tips

1. **Start fresh**: The user seeding script clears existing users before creating new ones
2. **Order matters**: Seed users first, then buses (buses may reference user data)
3. **Development only**: These scripts are for development/testing only
4. **Check database**: Make sure MongoDB is running before executing any seed script

## API Testing

Once seeded, you can test your API endpoints:

```bash
# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testadmin@busroute.com", "password": "admin123"}'

# Login as user
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@busroute.com", "password": "user123"}'
```
