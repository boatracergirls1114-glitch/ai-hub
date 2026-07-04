# DATABASE DESIGN

## articles

ナレッジ記事を保存する。

| column | type | description |
|---|---|---|
| id | uuid/text | 記事ID |
| title | text | タイトル |
| slug | text | URL用識別子 |
| summary | text | 概要 |
| body | text | Markdown本文 |
| category | text | カテゴリ |
| tags | text[] | タグ |
| status | text | published/deleted |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

## future tables

### work_logs

AI Hub構築やトラブル対応の作業ログ。

### ai_jobs

AI要約やナレッジ化の処理履歴。

### files

PDF、画像、動画、添付ファイル管理。

### embeddings

RAG検索用ベクトルデータ。
