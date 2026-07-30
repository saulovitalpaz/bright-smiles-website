const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const { createEncryption } = require('../utils/encryption');
const { migratePatientEncryption } = require('../utils/patientEncryptionMigration');

const prisma = new PrismaClient();

migratePatientEncryption({ prisma, encryption: createEncryption(process.env) })
    .catch(() => {
        console.error('Patient encryption migration failed.');
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
