import Database from 'better-sqlite3';
import { config } from './config';
import { encrypt, decrypt } from './encryption';
import * as fs from 'fs';
import * as path from 'path';

interface MachineAccount {
  apiKey: string;
  encryptedSecret: string;
  encryptedNullifier: string;
  commitment: string;
  amount: string;
  token: string;
  blockNumber: number;
  createdAt: number;
}

let db: Database | null = null;

/**
 * Initialize database
 */
export function initDatabase(): void {
  // Ensure data directory exists
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.dbPath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS machine_accounts (
      api_key TEXT PRIMARY KEY,
      encrypted_secret TEXT NOT NULL,
      encrypted_nullifier TEXT NOT NULL,
      commitment TEXT NOT NULL,
      amount TEXT NOT NULL,
      token TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
}

/**
 * Save machine account with encrypted secrets
 */
export function saveAccount(account: {
  apiKey: string;
  secret: string;
  nullifier: string;
  commitment: string;
  amount: string;
  token: string;
  blockNumber: number;
}): void {
  if (!db) throw new Error('Database not initialized');

  const encryptedSecret = encrypt(account.secret, config.encryptionKey);
  const encryptedNullifier = encrypt(account.nullifier, config.encryptionKey);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO machine_accounts 
    (api_key, encrypted_secret, encrypted_nullifier, commitment, amount, token, block_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    account.apiKey,
    encryptedSecret,
    encryptedNullifier,
    account.commitment,
    account.amount,
    account.token,
    account.blockNumber,
    Date.now()
  );
}

/**
 * Get machine account and decrypt secrets
 */
export function getAccount(apiKey: string): {
  secret: string;
  nullifier: string;
  commitment: string;
  amount: string;
  token: string;
  blockNumber: number;
} | null {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare('SELECT * FROM machine_accounts WHERE api_key = ?');
  const row = stmt.get(apiKey) as any;

  if (!row) {
    return null;
  }

  try {
    const secret = decrypt(row.encrypted_secret, config.encryptionKey);
    const nullifier = decrypt(row.encrypted_nullifier, config.encryptionKey);

    return {
      secret,
      nullifier,
      commitment: row.commitment,
      amount: row.amount,
      token: row.token,
      blockNumber: row.block_number,
    };
  } catch (error) {
    throw new Error(`Failed to decrypt account data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update account after payment (new commitment, reduced amount)
 */
export function updateAccount(
  apiKey: string,
  updates: {
    commitment?: string;
    amount?: string;
    secret?: string;
    nullifier?: string;
  }
): void {
  if (!db) throw new Error('Database not initialized');

  const account = getAccount(apiKey);
  if (!account) throw new Error('Account not found');

  const updatesList: string[] = [];
  const values: any[] = [];

  if (updates.commitment) {
    updatesList.push('commitment = ?');
    values.push(updates.commitment);
  }
  if (updates.amount) {
    updatesList.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.secret) {
    const encryptedSecret = encrypt(updates.secret, config.encryptionKey);
    updatesList.push('encrypted_secret = ?');
    values.push(encryptedSecret);
  }
  if (updates.nullifier) {
    const encryptedNullifier = encrypt(updates.nullifier, config.encryptionKey);
    updatesList.push('encrypted_nullifier = ?');
    values.push(encryptedNullifier);
  }

  if (updatesList.length === 0) return;

  values.push(apiKey);

  const stmt = db.prepare(
    `UPDATE machine_accounts SET ${updatesList.join(', ')} WHERE api_key = ?`
  );
  stmt.run(...values);
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
