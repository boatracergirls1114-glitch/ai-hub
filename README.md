# AI Hub v1.1.1 Hotfix

## 修正内容

- 検索表示修正
- 検索結果件数表示
- 検索クリア
- コードブロック改善
- Copyボタン
- Markdownプレビュー

## 反映方法

このZIP内のファイルをGitHubの同じ場所に上書きアップロードしてください。

その後、サーバーで:

```bash
cd /opt/ai-hub
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
curl http://localhost/api/health
```

`v1.1.1` が出ればOKです。
