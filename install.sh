#!/usr/bin/env bash
set -e

echo "AI Hub v1.0.0-alpha install"

docker compose up -d --build

echo ""
echo "起動しました。"
echo "URL: http://$(hostname -I | awk '{print $1}')"
echo "Admin: admin / docker-compose.yml の ADMIN_PASSWORD"
