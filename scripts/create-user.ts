#!/usr/bin/env tsx
/**
 * Development utility to create users directly in the database
 *
 * Usage:
 *   npm run create-user -- --email user@example.com --password mypass123 --firm-id 1
 *   npm run create-user -- --email admin@example.com --password admin123 --firm-id 1 --role admin
 *   npm run create-user -- --email user@example.com --password mypass --firm-name "Test Company" --create-firm
 *
 * Options:
 *   --email         User email (required)
 *   --password      User password (required)
 *   --firm-id       Existing firm ID (required unless --create-firm)
 *   --firm-name     Firm name (required if --create-firm)
 *   --create-firm   Create a new firm
 *   --role          User role: 'admin' or 'user' (default: 'user')
 *   --full-name     User's full name (optional)
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface CreateUserArgs {
  email: string;
  password: string;
  firmId?: number;
  firmName?: string;
  createFirm?: boolean;
  role?: 'admin' | 'user';
  fullName?: string;
}

async function parseArgs(): Promise<CreateUserArgs> {
  const args = process.argv.slice(2);
  const parsed: CreateUserArgs = {
    email: '',
    password: '',
    role: 'user',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--email':
        parsed.email = args[++i];
        break;
      case '--password':
        parsed.password = args[++i];
        break;
      case '--firm-id':
        parsed.firmId = parseInt(args[++i], 10);
        break;
      case '--firm-name':
        parsed.firmName = args[++i];
        break;
      case '--create-firm':
        parsed.createFirm = true;
        break;
      case '--role':
        const role = args[++i];
        if (role !== 'admin' && role !== 'user') {
          throw new Error('Role must be "admin" or "user"');
        }
        parsed.role = role;
        break;
      case '--full-name':
        parsed.fullName = args[++i];
        break;
      default:
        if (args[i].startsWith('--')) {
          throw new Error(`Unknown option: ${args[i]}`);
        }
    }
  }

  return parsed;
}

function validateArgs(args: CreateUserArgs): void {
  if (!args.email) {
    throw new Error('--email is required');
  }
  if (!args.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  if (!args.password) {
    throw new Error('--password is required');
  }
  if (args.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (args.createFirm) {
    if (!args.firmName) {
      throw new Error('--firm-name is required when using --create-firm');
    }
  } else {
    if (!args.firmId) {
      throw new Error('--firm-id is required (or use --create-firm --firm-name)');
    }
  }
}

async function createFirm(name: string): Promise<number> {
  if (!POSTGREST_BASE_URL) {
    throw new Error('POSTGREST_BASE_URL not configured in .env.local');
  }

  console.log(`Creating firm: ${name}`);

  // Generate a simple license key for dev
  const licenseKey = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const response = await fetch(`${POSTGREST_BASE_URL}/firms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      name,
      license_key: licenseKey,
      used_this_month: 0,
      plan_limit: 10000, // Dev default
      is_active: true,
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create firm: ${response.status} - ${error}`);
  }

  const firms = await response.json();
  const firm = Array.isArray(firms) ? firms[0] : firms;

  console.log(`✓ Firm created with ID: ${firm.id}`);
  return firm.id;
}

async function createUser(args: CreateUserArgs, firmId: number): Promise<void> {
  if (!POSTGREST_BASE_URL) {
    throw new Error('POSTGREST_BASE_URL not configured in .env.local');
  }

  console.log(`Creating user: ${args.email}`);
  console.log(`  Firm ID: ${firmId}`);
  console.log(`  Role: ${args.role}`);
  if (args.fullName) {
    console.log(`  Full Name: ${args.fullName}`);
  }

  // Hash the password
  // const passwordHash = await bcrypt.hash(args.password, 10);

  // Create the user
  const response = await fetch(`${POSTGREST_BASE_URL}/portal_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      email: args.email.toLowerCase().trim(),
      password_hash: args.password,
      full_name: args.fullName || null,
      firm_id: firmId,
      role: args.role,
      is_active: true,
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create user: ${response.status} - ${error}`);
  }

  const users = await response.json();
  const user = Array.isArray(users) ? users[0] : users;

  console.log(`✓ User created successfully!`);
  console.log(`  User ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role: ${user.role}`);
  console.log(`\nYou can now login with:`);
  console.log(`  Email: ${args.email}`);
  console.log(`  Password: ${args.password}`);
}

async function main() {
  try {
    // Check environment
    if (!POSTGREST_BASE_URL) {
      console.error('❌ Error: POSTGREST_BASE_URL is not configured');
      console.error('Make sure you have a .env.local file with POSTGREST_BASE_URL set');
      process.exit(1);
    }

    const args = await parseArgs();
    validateArgs(args);

    let firmId = args.firmId;

    // Create firm if requested
    if (args.createFirm && args.firmName) {
      firmId = await createFirm(args.firmName);
    }

    if (!firmId) {
      throw new Error('No firm ID available');
    }

    // Create user
    await createUser(args, firmId);

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    console.error('\nUsage:');
    console.error('  npm run create-user -- --email user@example.com --password mypass123 --firm-id 1');
    console.error('  npm run create-user -- --email admin@example.com --password admin123 --firm-id 1 --role admin');
    console.error('  npm run create-user -- --email user@example.com --password mypass --firm-name "Test Company" --create-firm');
    console.error('\nOptions:');
    console.error('  --email         User email (required)');
    console.error('  --password      User password (required)');
    console.error('  --firm-id       Existing firm ID (required unless --create-firm)');
    console.error('  --firm-name     Firm name (required if --create-firm)');
    console.error('  --create-firm   Create a new firm');
    console.error('  --role          User role: "admin" or "user" (default: "user")');
    console.error('  --full-name     User\'s full name (optional)');
    process.exit(1);
  }
}

main();
