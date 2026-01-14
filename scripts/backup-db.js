const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
const backupDir = path.join(__dirname, '../backups');

if (!dbUrl) {
    console.error('Error: DATABASE_URL not found in .env file');
    process.exit(1);
}

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const fileName = `backup-${timestamp}.sql`;
const filePath = path.join(backupDir, fileName);

console.log(`Starting backup to ${fileName}...`);

try {
    // We use pg_dump. Make sure it's installed on your system.
    execSync(`pg_dump "${dbUrl}" > "${filePath}"`, { stdio: 'inherit' });
    console.log(`Backup completed successfully: ${filePath}`);
} catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
}
