"""Download public ICP-Brasil trust material from the official HTTPS repository.

This administrative operation never consumes a user's certificate or password.
"""

import argparse
import hashlib
import io
import json
import re
import ssl
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization

SOURCE = 'https://acraiz.icpbrasil.gov.br/credenciadas/'
ROOT_VERSIONS = (4, 5, 6, 7, 12, 13)
MAX_DOWNLOAD = 16 * 1024 * 1024


class SameRepositoryRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urlsplit(newurl).scheme != 'https' or urlsplit(newurl).hostname != 'acraiz.icpbrasil.gov.br':
            raise ValueError('Trust repository redirect rejected.')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def download(url):
    context = ssl.create_default_context()
    if hasattr(ssl, 'enum_certificates'):
        intermediates = [ssl.DER_cert_to_PEM_cert(certificate) for certificate, encoding, _trust in ssl.enum_certificates('CA')
                         if encoding == 'x509_asn']
        if intermediates:
            context.load_verify_locations(cadata=''.join(intermediates))
    opener = urllib.request.build_opener(SameRepositoryRedirect, urllib.request.HTTPSHandler(context=context))
    with opener.open(url, timeout=30) as response:
        data = response.read(MAX_DOWNLOAD + 1)
    if len(data) > MAX_DOWNLOAD:
        raise ValueError('Trust download exceeds limit.')
    return data


def parse_certificate(raw):
    return x509.load_pem_x509_certificate(raw) if raw.startswith(b'-----BEGIN') else x509.load_der_x509_certificate(raw)


def evidence_hosts(certificate):
    urls = []
    for extension in certificate.extensions:
        if isinstance(extension.value, x509.CRLDistributionPoints):
            for point in extension.value:
                urls.extend(item.value for item in (point.full_name or []) if isinstance(item, x509.UniformResourceIdentifier))
        elif isinstance(extension.value, x509.AuthorityInformationAccess):
            urls.extend(item.access_location.value for item in extension.value if isinstance(item.access_location, x509.UniformResourceIdentifier))
    return {urlsplit(url).hostname.lower() for url in urls if urlsplit(url).scheme in ('http', 'https') and urlsplit(url).hostname}


def prepare(output):
    archive_url = SOURCE + 'CertificadosAC-ICP-Brasil/ACcompactado.zip'
    archive = download(archive_url)
    hash_file = download(SOURCE + 'CertificadosAC-ICP-Brasil/hashsha512.txt').decode('ascii', errors='strict')
    expected = re.findall(r'(?<![a-fA-F0-9])[a-fA-F0-9]{128}(?![a-fA-F0-9])', hash_file)
    actual = hashlib.sha512(archive).hexdigest()
    if actual not in {value.lower() for value in expected}:
        raise ValueError('Official CA archive SHA-512 does not match.')
    roots = []
    for version in ROOT_VERSIONS:
        certificate = parse_certificate(download(SOURCE + f'RAIZ/ICP-Brasilv{version}.crt'))
        if certificate.subject != certificate.issuer or not certificate.extensions.get_extension_for_class(x509.BasicConstraints).value.ca:
            raise ValueError('Official root certificate invalid.')
        roots.append(certificate)
    authorities = []
    with zipfile.ZipFile(io.BytesIO(archive)) as zipped:
        entries = zipped.infolist()
        if len(entries) > 4096 or sum(item.file_size for item in entries) > 64 * 1024 * 1024:
            raise ValueError('CA archive exceeds extraction limits.')
        for entry in entries:
            if entry.is_dir() or Path(entry.filename).suffix.lower() not in ('.crt', '.cer', '.pem'):
                continue
            if entry.file_size > 128 * 1024:
                raise ValueError('CA certificate exceeds size limit.')
            try:
                certificate = parse_certificate(zipped.read(entry))
                if certificate.extensions.get_extension_for_class(x509.BasicConstraints).value.ca:
                    authorities.append(certificate)
            except (ValueError, x509.ExtensionNotFound):
                continue
    if not authorities:
        raise ValueError('Official archive contains no authorities.')
    hosts = set()
    for certificate in [*roots, *authorities]:
        hosts.update(evidence_hosts(certificate))
    output.mkdir(parents=True, exist_ok=True)
    files = {
        'roots.pem': b''.join(item.public_bytes(serialization.Encoding.PEM) for item in roots),
        'authorities.pem': b''.join(item.public_bytes(serialization.Encoding.PEM) for item in authorities),
        'allowed-hosts.txt': (','.join(sorted(hosts)) + '\n').encode(),
        'manifest.json': (json.dumps({'source': archive_url, 'archiveSha512': actual,
            'retrievedAt': datetime.now(timezone.utc).isoformat(), 'authorities': len(authorities),
            'roots': [{'version': version, 'sha256': cert.fingerprint(hashes.SHA256()).hex()}
                      for version, cert in zip(ROOT_VERSIONS, roots)]}, indent=2) + '\n').encode(),
    }
    for name, data in files.items():
        temporary = output / (name + '.pending')
        temporary.write_bytes(data)
        temporary.replace(output / name)
    print(f'Prepared {len(roots)} public roots and {len(authorities)} public CA certificates. No private certificate was processed.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=Path(__file__).parent / 'trust')
    arguments = parser.parse_args()
    prepare(arguments.output)
