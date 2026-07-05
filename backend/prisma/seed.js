import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.article.count();
  if (count > 0) return;

  await prisma.article.createMany({
    data: [
      {
        slug: "ai-hub-beta",
        title: "AI Hub v1.0.0-beta 実装メモ",
        category: "AI Hub",
        summary: "完全日本語化、新規作成、編集、削除、検索に対応した実用版。",
        tags: ["AI Hub", "Docker", "React", "PostgreSQL"],
        body: `## 概要

AI Hub v1.0.0-beta は、実際にナレッジを追加・編集・削除できる最初の実用版です。

## できること

- ナレッジ一覧
- ナレッジ詳細表示
- 新規作成
- 編集
- 削除
- タグ管理
- カテゴリ管理
- 検索

## 次の予定

v1.1.0でAI要約、ナレッジ化ボタンを追加します。`
      },
      {
        slug: "ai-hub-setup-log",
        title: "AI Hub構築ログ",
        category: "構築ログ",
        summary: "Proxmoxコンテナ、Docker、GitHub連携、Nginx公開までの記録。",
        tags: ["Proxmox", "Docker", "GitHub", "Nginx"],
        body: `## 目的

AI HubをProxmox上のLXCコンテナで動かす。

## 実施内容

- ホスト名 ai-hub
- Docker導入
- GitHub連携
- Docker Compose起動
- Nginx公開

## トラブル

80番ポートが仮Nginxに使われていた。
ai-hub-nginxがbackendを名前解決できなかった。

## 解決

古いNginxコンテナを削除し、nginx設定をコンテナ名指定に変更した。`
      }
    ]
  });
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
