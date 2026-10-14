"""One operation per isolated process. Secrets travel over stdin, never argv."""

import asyncio
import json
import logging
import sys

MAX_REQUEST_BYTES = 16 * 1024 * 1024


def limit_resources():
    if sys.platform != 'win32':
        import resource
        resource.setrlimit(resource.RLIMIT_CPU, (40, 40))
        resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024, 512 * 1024 * 1024))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))


def main():
    logging.disable(logging.CRITICAL)
    limit_resources()
    try:
        from engine import SigningError, handle
        raw = sys.stdin.buffer.read(MAX_REQUEST_BYTES + 1)
        if len(raw) > MAX_REQUEST_BYTES:
            result = {'error': {'code': 'INVALID_UPLOAD', 'message': 'A solicitação excede o limite permitido.'}}
        else:
            try:
                result = asyncio.run(handle(json.loads(raw)))
            except SigningError as error:
                result = {'error': {'code': error.code, 'message': str(error)}}
            except Exception:
                result = {'error': {'code': 'SIGNING_FAILED', 'message': 'Não foi possível processar o documento com segurança.'}}
    except Exception:
        result = {'error': {'code': 'SIGNING_NOT_CONFIGURED', 'message': 'O motor de assinatura precisa ser configurado no servidor.'}}
    sys.stdout.write(json.dumps(result, ensure_ascii=True, separators=(',', ':')))


if __name__ == '__main__':
    main()
