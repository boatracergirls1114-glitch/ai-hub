# DEVELOPMENT GUIDE

## Policy

動けばOKではなく、長く使える本番品質を目指す。

## Development Flow

1. 要件を決める
2. UIを決める
3. データ構造を決める
4. 実装
5. テスト
6. GitHubへ反映
7. 104で更新

## Versioning

Semantic Versioningを使う。

```text
v1.0.0
v1.1.0
v1.2.0
v2.0.0
```

## Branch Strategy

最初はシンプルにする。

```text
main
```

安定してきたら以下を使う。

```text
main
develop
feature/*
```

## Deployment

104コンテナで実行。

```bash
cd /opt/ai-hub
git pull
docker compose up -d --build
```
