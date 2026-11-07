#!/usr/bin/env bash

set -Eeuo pipefail

# ==========================================
# Configuration
# ==========================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

cd "$ROOT_DIR"

COMPOSE_FILE="docker/compose.production.yml"

PUBLIC_IP="${PUBLIC_IP:?Please set PUBLIC_IP}"

CERTBOT_EMAIL="${CERTBOT_EMAIL:?Please set CERTBOT_EMAIL}"

# ==========================================
# Validation
# ==========================================

if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "ERROR: Compose file not found: $COMPOSE_FILE"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running or accessible."
    exit 1
fi

if ! docker compose -f "$COMPOSE_FILE" ps --status running nginx | grep -q nginx; then
    echo "ERROR: Nginx must be running before certificate issuance."
    exit 1
fi

echo "=========================================="
echo "Certificate issuance"
echo "=========================================="
echo "Public IP: $PUBLIC_IP"
echo "Email:     $CERTBOT_EMAIL"
echo

# ==========================================
# Staging test
# ==========================================

echo "Testing certificate issuance against staging..."

docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
    --dry-run \
    --non-interactive \
    --agree-tos \
    --email "$CERTBOT_EMAIL" \
    --preferred-profile shortlived \
    --webroot \
    --webroot-path /var/www/certbot \
    --ip-address "$PUBLIC_IP"

# ==========================================
# Production certificate
# ==========================================

echo
echo "Requesting production certificate..."

docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
    --non-interactive \
    --agree-tos \
    --email "$CERTBOT_EMAIL" \
    --preferred-profile shortlived \
    --webroot \
    --webroot-path /var/www/certbot \
    --ip-address "$PUBLIC_IP"

echo
echo "=========================================="
echo "Certificate successfully issued"
echo "=========================================="

echo "Certificate:"
echo "certificates/conf/live/$PUBLIC_IP/fullchain.pem"

echo "Private key:"
echo "certificates/conf/live/$PUBLIC_IP/privkey.pem"