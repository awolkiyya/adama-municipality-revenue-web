#!/usr/bin/env bash

set -Eeuo pipefail

# ==========================================
# Configuration
# ==========================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

cd "$ROOT_DIR"

COMPOSE_FILE="docker/compose.production.yml"

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

# ==========================================
# Renewal
# ==========================================

echo "=========================================="
echo "Let's Encrypt certificate renewal"
echo "=========================================="

docker compose -f "$COMPOSE_FILE" run --rm certbot renew --quiet

# ==========================================
# Nginx validation
# ==========================================

echo "Validating Nginx configuration..."

docker compose -f "$COMPOSE_FILE" exec -T nginx nginx -t

# ==========================================
# Reload Nginx
# ==========================================

echo "Reloading Nginx..."

docker compose -f "$COMPOSE_FILE" exec -T nginx nginx -s reload

echo
echo "=========================================="
echo "Certificate renewal check completed"
echo "=========================================="