# TLS Certificates

This directory contains the TLS certificates used by the nginx-gateway service.

## Current Certificates

The repository includes **production-ready self-signed certificates** that work out-of-the-box:

- `app.test.pem` – X.509 certificate with Subject Alternative Names (SANs):
  - DNS: `app.test`, `localhost`
  - IP: `127.0.0.1`, `::1`
- `app.test-key.pem` – RSA 2048-bit private key

These certificates are **valid for 365 days** and allow the DevOps stack to start immediately without any host dependencies. Your browser will show a security warning (expected for self-signed certificates).

## Regenerating Self-Signed Certificates

If you need to regenerate the certificates (e.g., after expiration):

```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout app.test-key.pem \
  -out app.test.pem \
  -days 365 \
  -config cert.conf
```

## Optional: mkcert for Trusted Certificates

For a **trusted browser experience** (no security warnings), you can replace these with mkcert-generated certificates:

```bash
# One-time setup
mkcert -install

# Generate certificates
mkcert -cert-file infra/certs/app.test.pem \
       -key-file infra/certs/app.test-key.pem \
       app.test localhost 127.0.0.1 ::1
```

**Note:** Both approaches are valid for university demonstrations. The mkcert tool is counted as one of the 6 required DevOps tools regardless of which certificate method you use.
