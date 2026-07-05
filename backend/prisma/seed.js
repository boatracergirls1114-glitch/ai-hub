import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.article.count();
  if (count > 0) return;

  await prisma.article.createMany({
    data: [
      {
        slug: "ai-hub-alpha",
        title: "AI Hub v1.0.0-alpha 実装メモ",
        category: "AI Hub",
        summary: "AI Hubの最初の実装版。ログイン、ダッシュボード、ナレッジ一覧を備えた骨格。",
        tags: ["AI Hub", "Docker", "React", "PostgreSQL"],
        body: `## 概要

AI Hub v1.0.0-alpha は、Personal Knowledge OS の最初の実装版です。

## 実装内容

- React frontend
- Node.js backend
- PostgreSQL
- Nginx
- Docker Compose
- ログイン
- ダッシュボード
- ナレッジ一覧

## 次の予定

v1.0.0-beta では、記事作成・編集・削除を強化します。`
      },
      {
        slug: "knowledge-core",
        title: "Knowledge Coreの考え方",
        category: "設計",
        summary: "AI Hubの中心機能であるナレッジ管理の基本方針。",
        tags: ["ナレッジ", "設計", "Second Brain"],
        body: `## 方針

AI Hubは、単なるメモ帳ではなく、知識を貯めて、つなげて、育てるためのPersonal Knowledge OSです。

## 大切なこと

- 作業ログを残す
- トラブルも残す
- コマンドも残す
- なぜそうしたかも残す

## 将来

AIが保存済みナレッジを検索し、あなた専用の回答を返せるようにします。`
      }
    ]
  });
}

main()
  .then(() => console.log("seed complete"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
