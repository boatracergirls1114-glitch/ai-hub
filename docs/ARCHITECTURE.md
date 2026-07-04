# ARCHITECTURE

## Overview

AI HubはDocker Composeで構成する。

```text
AI Hub
├── frontend  React
├── backend   Node.js API
├── postgres  Database
├── nginx     Reverse Proxy
└── docs      Project Documents
```

## Frontend

- React
- ダークテーマ
- ダッシュボード
- ナレッジ一覧
- 管理画面

## Backend

- Node.js
- Express
- REST API
- JWTログイン
- AI連携の入口

## Database

- PostgreSQL
- ナレッジ
- タグ
- カテゴリ
- 作業ログ
- 将来のRAG用データ

## Reverse Proxy

- Nginx
- `/` frontend
- `/api` backend
