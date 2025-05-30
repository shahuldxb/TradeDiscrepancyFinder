import { connectToAzureSQL } from './azureSqlConnection';
import { pool } from './db';

export async function createAuthTablesInAzure() {
  try {
    const azurePool = await connectToAzureSQL();
    
    // Create users table in Azure SQL
    await azurePool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
          id VARCHAR(255) PRIMARY KEY NOT NULL,
          email VARCHAR(255) UNIQUE,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          profile_image_url VARCHAR(255),
          role VARCHAR(50) DEFAULT 'analyst',
          customer_segment VARCHAR(50),
          operation_segment VARCHAR(50),
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create sessions table in Azure SQL
    await azurePool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
      CREATE TABLE sessions (
          sid VARCHAR(255) PRIMARY KEY NOT NULL,
          sess NVARCHAR(MAX) NOT NULL,
          expire DATETIME2 NOT NULL
      )
    `);

    // Create index on sessions expire column
    await azurePool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_session_expire')
      CREATE INDEX IDX_session_expire ON sessions (expire)
    `);

    console.log('Successfully created auth tables in Azure SQL');
    return true;
  } catch (error) {
    console.error('Error creating auth tables in Azure:', error);
    throw error;
  }
}

export async function migrateUserDataToAzure() {
  try {
    const azurePool = await connectToAzureSQL();
    
    // Get all users from PostgreSQL
    const postgresResult = await pool.query('SELECT * FROM users');
    const users = postgresResult.rows;
    
    console.log(`Migrating ${users.length} users to Azure SQL...`);
    
    // Migrate each user to Azure
    for (const user of users) {
      await azurePool.request()
        .input('id', user.id)
        .input('email', user.email)
        .input('first_name', user.firstName || user.first_name)
        .input('last_name', user.lastName || user.last_name)
        .input('profile_image_url', user.profileImageUrl || user.profile_image_url)
        .input('role', user.role || 'analyst')
        .input('customer_segment', user.customerSegment || user.customer_segment)
        .input('operation_segment', user.operationSegment || user.operation_segment)
        .input('is_active', user.isActive !== false ? 1 : 0)
        .input('created_at', user.createdAt || user.created_at || new Date())
        .input('updated_at', user.updatedAt || user.updated_at || new Date())
        .query(`
          INSERT INTO users (id, email, first_name, last_name, profile_image_url, 
                           role, customer_segment, operation_segment, is_active, created_at, updated_at)
          VALUES (@id, @email, @first_name, @last_name, @profile_image_url, 
                 @role, @customer_segment, @operation_segment, @is_active, @created_at, @updated_at)
        `);
    }
    
    console.log('Successfully migrated users to Azure SQL');
    return users.length;
  } catch (error) {
    console.error('Error migrating users to Azure:', error);
    throw error;
  }
}

export async function migrateSessionDataToAzure() {
  try {
    const azurePool = await connectToAzureSQL();
    
    // Get all active sessions from PostgreSQL
    const postgresResult = await pool.query('SELECT * FROM sessions WHERE expire > NOW()');
    const sessions = postgresResult.rows;
    
    console.log(`Migrating ${sessions.length} active sessions to Azure SQL...`);
    
    // Migrate each session to Azure
    for (const session of sessions) {
      await azurePool.request()
        .input('sid', session.sid)
        .input('sess', JSON.stringify(session.sess))
        .input('expire', session.expire)
        .query(`
          INSERT INTO sessions (sid, sess, expire)
          VALUES (@sid, @sess, @expire)
        `);
    }
    
    console.log('Successfully migrated sessions to Azure SQL');
    return sessions.length;
  } catch (error) {
    console.error('Error migrating sessions to Azure:', error);
    throw error;
  }
}

export async function deletePostgreSQLAuthData() {
  try {
    // Delete all sessions first (no foreign key constraints)
    await pool.query('DELETE FROM sessions');
    console.log('Deleted all sessions from PostgreSQL');
    
    // Delete all users
    await pool.query('DELETE FROM users');
    console.log('Deleted all users from PostgreSQL');
    
    return true;
  } catch (error) {
    console.error('Error deleting auth data from PostgreSQL:', error);
    throw error;
  }
}

export async function fullAuthMigration() {
  console.log('Starting full authentication migration to Azure SQL...');
  
  try {
    // Step 1: Create tables in Azure
    await createAuthTablesInAzure();
    
    // Step 2: Migrate user data
    const userCount = await migrateUserDataToAzure();
    
    // Step 3: Migrate session data
    const sessionCount = await migrateSessionDataToAzure();
    
    // Step 4: Delete PostgreSQL data
    await deletePostgreSQLAuthData();
    
    console.log(`Migration completed successfully:`);
    console.log(`- Migrated ${userCount} users`);
    console.log(`- Migrated ${sessionCount} sessions`);
    console.log(`- Cleaned PostgreSQL auth tables`);
    
    return {
      success: true,
      userCount,
      sessionCount
    };
  } catch (error) {
    console.error('Full auth migration failed:', error);
    throw error;
  }
}