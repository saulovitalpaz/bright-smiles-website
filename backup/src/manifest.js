export const createManifest = ({ key, timestamp, size, sha256 }) => ({
  version: 1,
  timestamp,
  objectKey: key,
  bytes: size,
  sha256,
  format: 'postgres-custom-aes-256-gcm'
});
