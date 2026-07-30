const requiredNames = [
  'DATABASE_URL',
  'BACKUP_R2_ENDPOINT',
  'BACKUP_R2_BUCKET',
  'BACKUP_R2_ACCESS_KEY_ID',
  'BACKUP_R2_SECRET_ACCESS_KEY',
  'BACKUP_ENCRYPTION_KEY'
];

const required = (env, name) => {
  const value = env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Invalid backup configuration.');
  }
  return value;
};

const parseEncryptionKey = (value) => {
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32 || key.toString('base64') !== value) {
    throw new Error('Invalid backup encryption key.');
  }
  return key;
};

export const loadConfig = (env = process.env) => {
  for (const name of requiredNames) required(env, name);

  const databaseUrl = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    throw new Error('Invalid backup configuration.');
  }

  const postgres = {
    host: databaseUrl.hostname,
    port: databaseUrl.port || '5432',
    database: decodeURIComponent(databaseUrl.pathname.replace(/^\//, '')),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    sslMode: databaseUrl.searchParams.get('sslmode') || 'prefer'
  };
  if (!postgres.host || !postgres.database || !postgres.user || !postgres.password) {
    throw new Error('Invalid backup configuration.');
  }

  const endpoint = new URL(env.BACKUP_R2_ENDPOINT);
  if (endpoint.protocol !== 'https:') {
    throw new Error('Invalid backup configuration.');
  }

  return {
    postgres,
    r2Endpoint: endpoint.toString().replace(/\/$/, ''),
    r2Bucket: env.BACKUP_R2_BUCKET,
    r2AccessKeyId: env.BACKUP_R2_ACCESS_KEY_ID,
    r2SecretAccessKey: env.BACKUP_R2_SECRET_ACCESS_KEY,
    encryptionKey: parseEncryptionKey(env.BACKUP_ENCRYPTION_KEY)
  };
};
