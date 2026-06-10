# Docker + Expo React Native Todoアプリ 実装方針

## 概要

Dockerコンテナ内でExpo開発サーバーを起動し、ホストマシンのスマートフォン/シミュレーターからアクセスするReact Native Todoアプリの構成。

---

## アーキテクチャ

```
ホストマシン
├── Docker Desktop
│   └── コンテナ (Node.js + Expo CLI)
│       ├── Expo Dev Server  :8081
│       └── Metro Bundler    :8082
└── Expo Go アプリ (iOS/Android) ← LAN経由で接続
```

---

## ディレクトリ構成

```
sample_reactnative_todo/
├── docs/
│   └── implementation-plan.md
├── app/                        # Expoアプリ本体
│   ├── app/                    # Expo Router のルート
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── components/
│   │   ├── TodoItem.tsx
│   │   ├── TodoList.tsx
│   │   └── AddTodoForm.tsx
│   ├── hooks/
│   │   └── useTodos.ts
│   ├── types/
│   │   └── todo.ts
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── .dockerignore
```

---

## Docker構成

### Dockerfile

- ベースイメージ: `node:20-alpine`
- Expo CLI をグローバルインストール
- ポート `8081`（Expo Dev Server）と `8082`（Metro Bundler）を公開
- `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` を設定してコンテナ外からアクセス可能にする

### docker-compose.yml

- `network_mode: host` または ポートマッピング `8081:8081`, `8082:8082`
- ホストのソースコードをボリュームマウントしてホットリロードを有効化
- `REACT_NATIVE_PACKAGER_HOSTNAME` 環境変数にホストマシンのLAN IPを設定

---

## Expoアプリ構成

### 使用技術

| 技術 | 用途 |
|------|------|
| Expo SDK 51+ | React Nativeフレームワーク |
| Expo Router v3 | ファイルベースルーティング |
| TypeScript | 型安全性 |
| AsyncStorage | Todoデータのローカル永続化 |
| React Hooks | 状態管理 |

### Todoアプリの機能

- [ ] Todo一覧表示
- [ ] Todo追加
- [ ] Todo完了/未完了トグル
- [ ] Todo削除
- [ ] データのAsyncStorageへの永続化

### データモデル

```typescript
type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};
```

---

## 開発フロー

### 初回セットアップ

```bash
# 1. イメージビルド
docker compose build

# 2. プロジェクト作成（コンテナ内で実行）
docker compose run --rm app yarn create expo-app . --template blank-typescript

# 3. 追加パッケージインストール
docker compose run --rm app yarn add @react-native-async-storage/async-storage

# 4. 開発サーバー起動
HOST_IP=192.168.1.10 docker compose up  # 自分のLAN IPに変更
```

### 接続方法

1. ホストマシンのLAN IPアドレスを確認（例: `192.168.1.10`）
2. `docker-compose.yml` の `REACT_NATIVE_PACKAGER_HOSTNAME` にそのIPを設定
3. スマートフォンで Expo Go アプリを起動
4. QRコードをスキャン、または `exp://192.168.1.10:8081` に手動接続

### iOSシミュレーターを使う場合

Mac上でXcode Simulatorを起動し、Expo GoをインストールしてLAN接続で開発。
`network_mode: host` はMac上のDockerでは非サポートのため、ポートマッピングを使用する。

---

## 注意事項

- **MacのDocker Desktop**: `network_mode: host` は未対応。ポートマッピング + `REACT_NATIVE_PACKAGER_HOSTNAME` でLAN IPを指定する。
- **ホットリロード**: ボリュームマウントによりコンテナ再起動なしにコード変更が反映される。
- **node_modules**: ホスト側にマウントしないよう `.dockerignore` と `volumes` で除外する（コンテナ内のみに置く）。

---

## 実装ステップ

1. `Dockerfile` と `docker-compose.yml` を作成
2. `docker compose run` でExpoプロジェクトを初期化
3. `types/todo.ts` でデータ型定義
4. `hooks/useTodos.ts` でCRUDロジックとAsyncStorage永続化を実装
5. `components/` に各UIコンポーネントを実装
6. `app/index.tsx` でコンポーネントを組み合わせて画面を完成
7. Expo Goで動作確認
