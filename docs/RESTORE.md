# AI Hub 復元メモ

## 復元対象

- AI Hub本体ファイル
- PostgreSQLデータベース
- Docker Compose構成
- nginx設定
- docs
- scripts

## 基本復元手順

```bash
cd /opt/ai-hub
docker compose down
```

```bash
cd /opt
tar -xzf ai-hub-v1.1.2-backup-YYYYMMDD-HHMMSS-files.tar.gz
```

```bash
cd /opt/ai-hub
docker compose up -d postgres
```

```bash
cat ai-hub-v1.1.2-backup-YYYYMMDD-HHMMSS-db.sql \
| docker exec -i ai-hub-postgres psql -U aihub aihub
```

```bash
docker compose up -d
curl http://localhost/api/health
```

## 注意

復元前に現在の `/opt/ai-hub` を別名退避しておくと安全。

```bash
mv /opt/ai-hub /opt/ai-hub-before-restore-$(date +%Y%m%d-%H%M)
```
