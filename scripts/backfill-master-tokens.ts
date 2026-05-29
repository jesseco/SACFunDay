import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

async function main() {
  console.log('🔄 Backfilling masterCheckinToken for local SQLite...');

  const sqlite = new Database('sacfundday.db');

  // Add column (non-unique for now to allow ALTER TABLE)
  try {
    sqlite.exec(`
      ALTER TABLE participants 
      ADD COLUMN master_checkin_token TEXT
    `);
    console.log('✓ Added master_checkin_token column');
  } catch (e: any) {
    if (e.message?.includes('duplicate column name')) {
      console.log('✓ Column already exists');
    } else {
      console.error('Error adding column:', e.message);
    }
  }

  // Backfill
  const rows = sqlite.prepare(`
    SELECT id FROM participants 
    WHERE master_checkin_token IS NULL
  `).all() as { id: number }[];

  console.log(`Found ${rows.length} participants without masterCheckinToken.`);

  const updateStmt = sqlite.prepare(`
    UPDATE participants 
    SET master_checkin_token = ? 
    WHERE id = ?
  `);

  let updated = 0;
  const transaction = sqlite.transaction((rows: { id: number }[]) => {
    for (const row of rows) {
      updateStmt.run(randomUUID(), row.id);
      updated++;
    }
  });

  transaction(rows);

  console.log(`✅ Done. Backfilled ${updated} participants with masterCheckinToken.`);
  sqlite.close();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
