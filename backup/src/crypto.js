import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { appendFile, mkdir, open, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';

const magic = Buffer.from('BSDBACK1');
const ivLength = 12;
const tagLength = 16;
const headerLength = magic.length + ivLength;

export const sha256File = async (filePath) => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
};

export const encryptFile = async (inputPath, outputPath, key) => {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.concat([magic, iv]));
  await pipeline(createReadStream(inputPath), cipher, createWriteStream(outputPath, { flags: 'a' }));
  await appendFile(outputPath, cipher.getAuthTag());

  const fileStats = await stat(outputPath);
  return { size: fileStats.size, sha256: await sha256File(outputPath) };
};

export const decryptFile = async (inputPath, outputPath, key) => {
  const fileStats = await stat(inputPath);
  if (fileStats.size <= headerLength + tagLength) throw new Error('Unable to decrypt backup.');

  const handle = await open(inputPath, 'r');
  const header = Buffer.alloc(headerLength);
  const tag = Buffer.alloc(tagLength);
  try {
    await handle.read(header, 0, headerLength, 0);
    await handle.read(tag, 0, tagLength, fileStats.size - tagLength);
  } finally {
    await handle.close();
  }

  if (!header.subarray(0, magic.length).equals(magic)) {
    throw new Error('Unable to decrypt backup.');
  }

  const iv = header.subarray(magic.length);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const temporaryPath = `${outputPath}.${randomUUID()}.partial`;

  try {
    await mkdir(dirname(outputPath), { recursive: true });
    await pipeline(
      createReadStream(inputPath, { start: headerLength, end: fileStats.size - tagLength - 1 }),
      decipher,
      createWriteStream(temporaryPath, { flags: 'wx' })
    );
    await rename(temporaryPath, outputPath);
  } catch {
    await rm(temporaryPath, { force: true });
    throw new Error('Unable to decrypt backup.');
  }
};
