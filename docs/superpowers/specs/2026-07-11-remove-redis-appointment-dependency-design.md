# Remove Redis Dependency from Appointment API

## Problem

The production API imports `server/workers/whatsappWorker.js` at startup. That module immediately creates a BullMQ queue and worker. When `REDIS_URL` is absent, it connects to `localhost:6379`; Railway's API container has no local Redis server, producing repeated `ECONNREFUSED` errors.

The reminder subsystem is not functional product behavior yet: its WhatsApp sender is a mock and appointment creation does not enqueue reminder jobs. Redis therefore adds availability risk without providing a working user feature.

## Design

Remove the inactive reminder subsystem from the API process:

- Remove the worker import and hourly reminder scheduler from `server/index.js`.
- Remove `bullmq` and `ioredis` from the server dependencies and lockfile.
- Remove the unused `server/workers/whatsappWorker.js` module.
- Leave appointment persistence unchanged: validated requests continue to write directly to PostgreSQL through Prisma.

No replacement queue library will be introduced. A future reminder feature should run as a separately deployable worker and connect to an explicitly configured queue and real WhatsApp provider.

## Error Handling

The API must not attempt any Redis connection during startup or appointment operations. Existing validation and Prisma error handling remain responsible for appointment request failures.

## Testing and Verification

- Add a regression test that starts/imports the API with no `REDIS_URL` and detects any attempt to load the retired worker or connect to Redis.
- Confirm the regression test fails before the production change and passes afterward.
- Run the server test suite and Prisma/server build checks.
- Run the repository build to detect integration regressions.

## Success Criteria

- Starting the Railway API without `REDIS_URL` produces no Redis connection attempts or `ECONNREFUSED` errors.
- Appointment routes remain available and persist through Prisma/PostgreSQL.
- BullMQ and ioredis are absent from runtime dependencies.
- Existing builds and tests pass.
