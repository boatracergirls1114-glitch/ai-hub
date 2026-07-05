import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main(){
 if(await prisma.article.count()>0)return;
 await prisma.article.createMany({data:[
  {slug:"ai-hub-v110-release",title:"AI Hub v1.1.0 リリースノート",category:"AI Hub",summary:"AI Hubに保存、記事作成・編集・削除、検索を備えた実用リリース版。",tags:["AI Hub","リリース","ナレッジ化"],body:`## 概要

AI Hub v1.1.0 は、日常的に使えるナレッジ管理のリリース版です。

## 主な機能

- ナレッジ一覧
- 詳細表示
- 新規作成
- 編集
- 削除
- 検索
- タグ / カテゴリ
- AI Hubに保存
- エクスポート`},
  {slug:"ai-hub-build-troubleshooting",title:"AI Hub構築トラブルシュート",category:"構築ログ",summary:"Docker、Nginx、GitHub連携で発生した問題と解決方法。",tags:["Docker","Nginx","GitHub","Proxmox"],body:`## 発生した問題

- 80番ポート競合
- nginxがbackendを名前解決できない
- git pull時にローカル変更で失敗
- alpha/betaの反映確認

## 解決

- 古いNginxコンテナを削除
- nginx設定をコンテナ名指定に修正
- git restoreでローカル変更を戻す
- docker compose build --no-cacheで再ビルド`}
 ]});
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>prisma.$disconnect());
