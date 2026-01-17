#!/usr/bin/env tsx
/**
 * Development utility to list users in the database
 *
 * Usage:
 *   npm run list-users
 *   npm run list-users -- --firm-id 1
 *   npm run list-users -- --email user@example.com
 *
 * Options:
 *   --firm-id       Filter by firm ID
 *   --email         Filter by email (partial match)
 *   --role          Filter by role (admin or user)
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface ListUsersArgs {
  firmId?: number;
  email?: string;
  role?: 'admin' | 'user';
}

async function parseArgs(): Promise<ListUsersArgs> {
  const args = process.argv.slice(2);
  const parsed: ListUsersArgs = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--firm-id':
        parsed.firmId = parseInt(args[++i], 10);
        break;
      case '--email':
        parsed.email = args[++i];
        break;
      case '--role':
        const role = args[++i];
        if (role !== 'admin' && role !== 'user') {
          throw new Error('Role must be "admin" or "user"');
        }
        parsed.role = role;
        break;
      default:
        if (args[i].startsWith('--')) {
          throw new Error(`Unknown option: ${args[i]}`);
        }
    }
  }

  return parsed;
}

async function listUsers(args: ListUsersArgs): Promise<void> {
  if (!POSTGREST_BASE_URL) {
    throw new Error('POSTGREST_BASE_URL not configured in .env.local');
  }

  // Build query
  const params = new URLSearchParams();

  if (args.firmId) {
    params.append('firm_id', `eq.${args.firmId}`);
  }

  if (args.email) {
    params.append('email', `ilike.*${args.email}*`);
  }

  if (args.role) {
    params.append('role', `eq.${args.role}`);
  }

  // Add ordering
  params.append('order', 'created_at.desc');

  const url = `${POSTGREST_BASE_URL}/portal_users?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch users: ${response.status} - ${error}`);
  }

  const users = await response.json();

  if (users.length === 0) {
    console.log('\nNo users found.');
    return;
  }

  // Fetch firms to show firm names
  const firmIds = [...new Set(users.map((u: any) => u.firm_id))];
  const firmsResponse = await fetch(
    `${POSTGREST_BASE_URL}/firms?id=in.(${firmIds.join(',')})`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  const firms = firmsResponse.ok ? await firmsResponse.json() : [];
  const firmMap = new Map(firms.map((f: any) => [f.id, f.name]));

  console.log(`\n Found ${users.length} user${users.length === 1 ? '' : 's'}:\n`);
  console.log('─'.repeat(120));
  console.log(
    'ID'.padEnd(6) +
    'Email'.padEnd(30) +
    'Full Name'.padEnd(25) +
    'Role'.padEnd(8) +
    'Firm'.padEnd(25) +
    'Active'.padEnd(8) +
    'Created'
  );
  console.log('─'.repeat(120));

  for (const user of users) {
    const firmName = firmMap.get(user.firm_id) || `Firm #${user.firm_id}`;
    const active = user.is_active ? '✓' : '✗';
    const createdAt = new Date(user.created_at).toLocaleDateString();

    console.log(
      String(user.id).padEnd(6) +
      (user.email || '').slice(0, 28).padEnd(30) +
      (user.full_name || '-').slice(0, 23).padEnd(25) +
      (user.role || 'user').padEnd(8) +
      firmName.slice(0, 23).padEnd(25) +
      active.padEnd(8) +
      createdAt
    );
  }

  console.log('─'.repeat(120));
  console.log();
}

async function main() {
  try {
    if (!POSTGREST_BASE_URL) {
      console.error('❌ Error: POSTGREST_BASE_URL is not configured');
      console.error('Make sure you have a .env.local file with POSTGREST_BASE_URL set');
      process.exit(1);
    }

    const args = await parseArgs();
    await listUsers(args);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    console.error('\nUsage:');
    console.error('  npm run list-users');
    console.error('  npm run list-users -- --firm-id 1');
    console.error('  npm run list-users -- --email user@example.com');
    console.error('  npm run list-users -- --role admin');
    console.error('\nOptions:');
    console.error('  --firm-id       Filter by firm ID');
    console.error('  --email         Filter by email (partial match)');
    console.error('  --role          Filter by role (admin or user)');
    process.exit(1);
  }
}

main();
