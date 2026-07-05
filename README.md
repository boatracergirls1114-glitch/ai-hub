# AI Hub v1.1.2 Backup Edition

## 内容

- NAS対応バックアップスクリプト
- ローカルバックアップ
- PostgreSQLダンプ
- 復元メモ自動生成
- 実装ナレッジ

## 反映方法

ZIPを展開して、`scripts/backup.sh` と `docs/*` をAI Hubに追加します。

```bash
cd /opt/ai-hub
mkdir -p scripts docs backups
```

```bash
cp scripts/backup.sh /opt/ai-hub/scripts/backup.sh
cp docs/* /opt/ai-hub/docs/
chmod +x /opt/ai-hub/scripts/backup.sh
```

## 実行

```bash
cd /opt/ai-hub
./scripts/backup.sh
```

## 保存先

ローカル:

```text
/opt/ai-hub/backups
```

NAS:

```text
/mnt/aihub-nas-backup
```
