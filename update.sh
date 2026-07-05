#!/usr/bin/env bash
set -e

echo "AI Hub update"

git pull
docker compose up -d --build

echo "更新しました。"
