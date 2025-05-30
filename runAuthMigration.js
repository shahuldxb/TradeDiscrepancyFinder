import { fullAuthMigration } from './server/migrateAuthToAzure.ts';

async function runMigration() {
  try {
    console.log('Starting authentication migration to Azure SQL...');
    const result = await fullAuthMigration();
    
    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
      console.log(`Users migrated: ${result.userCount}`);
      console.log(`Sessions migrated: ${result.sessionCount}`);
      console.log('PostgreSQL auth tables cleaned');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();