FROM node:20-bookworm-slim

# Python runs the isolated PDF signing worker; OpenSSL remains available to Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY signing/requirements.txt ./signing/requirements.txt
RUN python3 -m venv /opt/signing-python \
    && /opt/signing-python/bin/pip install --no-cache-dir -r signing/requirements.txt
ENV SIGNING_PYTHON_EXECUTABLE=/opt/signing-python/bin/python

COPY . .
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
