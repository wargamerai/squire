# SQUIRE

軽量なVASSAL風のWebアプリ「SQUIRE」の日本語紹介ホームページです。
ボードゲームをブラウザ上で編集し、オンラインで対戦する構想を紹介しています。

**このリポジトリに含まれるのは紹介HPです。アプリ本体の編集・対戦機能は含まれません。**

## ファイル

- `index.html` と `assets/`: 配信用にビルドしたホームページ
- `source/`: React・TypeScript・CSSの編集用ソース

他のゲーム、アップロード資料、セーブデータ、接続情報は含みません。

## 編集・ビルド

Node.js 22.12以降とpnpmを用意し、次を実行します。

```sh
cd source
pnpm install
pnpm dev
```

更新後は次のコマンドで確認し、ルートの公開用ファイルを再生成できます。

```sh
pnpm typecheck
pnpm build:site
```

バックエンドやReplit固有のサービスは不要です。

## ホームページを公開する場合

GitHubにソースを保存することと、Webサイトを公開することは別です。
このリポジトリは静的ホスティングへ配置できる構成です。
GitHub Pagesを使う場合は、リポジトリの Settings → Pages で
Deploy from a branch、mainブランチ、/(root) を指定して保存します。
公開先URLと公開の完了はPagesの画面で確認してください。

アプリ本体のURLが決まるまでは、紹介ページから起動できるようには見せていません。
