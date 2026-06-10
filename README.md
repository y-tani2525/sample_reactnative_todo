# sample_reactnative_todo

Docker + Expo による React Native Todo アプリ。

## 技術スタック

- React Native / Expo SDK 54
- TypeScript
- Docker

## 環境構築

詳細は [docs/environment-setup.md](docs/environment-setup.md) を参照。

```bash
# イメージビルド
docker compose build

# 依存関係インストール
docker compose run --rm app yarn install

# 起動
docker compose up
```

Expo Go（iOS / Android）でターミナルに表示された `exp://xxxx.loca.lt` に接続する。
