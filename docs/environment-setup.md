# 環境構築手順

このドキュメントは Docker + Expo React Native の環境を構築する際の実際の手順と、詰まりやすいポイントをまとめたものです。

---

## 前提

- Docker Desktop がインストール済みであること

### 接続モードの選択

環境によって接続方式を選ぶ。

| モード | 使いどころ | 備考 |
|--------|-----------|------|
| **LAN** | スマートフォンとMacが同じWiFiで端末間通信が許可されている | 高速・オフライン可 |
| **Tunnel** | 企業・大学WiFi（クライアント分離あり）、または `100.64.x.x` のCGNATネットワーク | インターネット経由で接続 |

`ifconfig en0` で IPv4 アドレスが `192.168.x.x` や `10.x.x.x` なら LAN モード、`100.64.x.x` のみなら Tunnel モードを推奨。

```bash
ifconfig en0 | grep "inet "
```

---

## ディレクトリ構成

```
sample_reactnative_todo/
├── app/                  # Expoアプリ本体
│   ├── .yarnrc.yml       # Yarn node-modules モード設定（必須）
│   ├── start.sh          # Tunnelモード用起動スクリプト
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   └── App.tsx
├── docs/
├── .env                  # 環境変数（gitignore済み）
├── .gitignore
├── Dockerfile
└── docker-compose.yml
```

---

## 手順

### 1. Dockerfile

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache git curl

# cloudflared をアーキテクチャに合わせてインストール
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then CF_ARCH="arm64"; else CF_ARCH="amd64"; fi && \
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" \
    -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

RUN corepack enable && corepack prepare yarn@stable --activate

WORKDIR /app

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

EXPOSE 80

CMD ["sh", "/app/start.sh"]
```

**LANモードの場合**は CMD と EXPOSE を変える：

```dockerfile
EXPOSE 19000

CMD ["yarn", "expo", "start", "--lan", "--port", "19000"]
```

### 2. docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./app:/app
    environment:
      - REACT_NATIVE_PACKAGER_HOSTNAME=${HOST_IP:-localhost}
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
    stdin_open: true
    tty: true
```

> **LANモードの場合**はポートを `"19000:19000"` に変更し、`HOST_IP` を設定して起動する。
> 他のコンテナとのポート競合は `docker ps` で確認する。

### 3. .gitignore（プロジェクトルート）

```
.env
```

### 4. Expoプロジェクトを手動作成

**`create-expo-app` は使わない**（Node 20 との互換性バグがある。詳細は後述）。
`app/` ディレクトリに以下のファイルを手動で作成する。

#### app/.yarnrc.yml
```yaml
nodeLinker: node-modules
```

> **必須**: これがないと Yarn が PnP モードで動作し、コンテナ再起動のたびにキャッシュが消えてエラーになる。

#### app/package.json
```json
{
  "name": "sample-reactnative-todo",
  "version": "1.0.0",
  "main": "App.tsx",
  "scripts": {
    "start": "expo start --lan --port 80",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~54.0.0",
    "expo-status-bar": "~2.0.1",
    "localtunnel": "^2.0.2",
    "react": "18.3.1",
    "react-native": "0.76.9"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.3.0",
    "typescript": "^5.3.0"
  },
  "private": true
}
```

> **SDKバージョンについて**: Expo Go の対応 SDK に合わせること。バージョン不一致が起きた場合は後述のトラブルシューティングを参照。

#### app/start.sh（Tunnelモード用）

```sh
#!/bin/sh
set -e

# localtunnel を先に起動してURLを発行させる
# (Expo が起動していなくてもURLは発行される)
npx lt --port 80 2>&1 | tee /tmp/lt.log &

echo "Tunnel URL 取得中..."
LT_URL=""
for i in $(seq 1 15); do
  LT_URL=$(grep -o 'https://[a-z0-9-]*\.loca\.lt' /tmp/lt.log 2>/dev/null | head -1)
  if [ -n "$LT_URL" ]; then
    break
  fi
  sleep 2
done

if [ -z "$LT_URL" ]; then
  echo "Tunnel URL の取得に失敗しました"
  exit 1
fi

LT_HOST=$(echo "$LT_URL" | sed 's|https://||')

echo ""
echo "======================================"
echo " Expo Go に入力してください："
echo " exp://$LT_HOST"
echo "======================================"

# ポート80で起動することでバンドルURLが http://xxxx.loca.lt/bundle となり
# ポート番号なしになるため localtunnel が正しく中継できる
REACT_NATIVE_PACKAGER_HOSTNAME=$LT_HOST yarn expo start --lan --port 80
```

#### app/app.json
```json
{
  "expo": {
    "name": "sample-reactnative-todo",
    "slug": "sample-reactnative-todo",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "package": "com.example.sampletodo",
      "adaptiveIcon": {
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

#### app/tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

#### app/babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

#### app/App.tsx
```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Todo App</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### 5. イメージのビルド

```bash
docker compose build
```

### 6. 依存関係のインストール

```bash
docker compose run --rm app yarn install
```

### 7. 開発サーバーの起動

#### LANモード

```bash
HOST_IP=<自分のLAN IP> docker compose up
```

#### Tunnelモード（localtunnel）

```bash
docker compose up
```

起動すると以下のような URL が出力される：

```
======================================
 Expo Go に入力してください：
 exp://xxxx.loca.lt
======================================
```

### 8. Expo Go で接続

スマートフォンに **Expo Go** アプリ（App Store / Google Play）をインストールする。

**LANモード**:
- QRコードをスキャン、または `exp://<HOST_IP>:19000` を手動入力

**Tunnelモード**:
- ターミナルに表示された `exp://xxxx.loca.lt` を手動入力
- 接続後にブラウザで `https://xxxx.loca.lt` を開き、IPアドレス入力（グローバルIPを `https://api.ipify.org` で確認）して「Continue」をタップする

> localtunnel は初回アクセス時にIP確認ページを挟む。ブラウザで一度通過した後、Expo Go から接続する。

---

## 詰まりやすいポイント

### create-expo-app が使えない

`yarn create expo-app` や `yarn dlx create-expo-app@latest` は **Node 20 と非互換** のため使用不可。

- Node 20: `ReadableStream` 型不一致エラー
- Node 18: `File is not defined` エラー

Node バージョンを変えても解決しない（バージョンごとに別のエラーが出る）。

**対処**: プロジェクトファイルを手動作成する（手順4参照）。

---

### Yarn PnP でコンテナ再起動時にパッケージが見つからない

Yarn v4 のデフォルトは PnP モードで、グローバルキャッシュを `/root/.yarn/berry/cache/` に置く。
コンテナを再作成するとこのキャッシュが消え、起動時に以下のエラーが出る。

```
Error: Required package missing from disk.
Missing package: @expo/cli@npm:0.18.31
```

**対処**: `app/.yarnrc.yml` に `nodeLinker: node-modules` を設定して通常の `node_modules` 方式を使う。
既存の PnP ファイルが残っている場合は先に削除する。

```bash
rm -rf app/.yarn app/.pnp.cjs app/.pnp.loader.mjs
docker compose run --rm app yarn install
```

---

### ポートがすでに使用中

他の Docker コンテナが同じポートを使っている場合、起動に失敗する。

```
Bind for 0.0.0.0:8081 failed: port is already allocated
```

**対処**: `docker ps` で確認し、`docker-compose.yml` のホスト側ポートを空き番号に変更する。
Expo の `--port` オプションとコンテナ内ポートも合わせて変更すること。

---

### node_modules ディレクトリがあると create-expo-app が失敗する

docker-compose の volume 設定（anonymous volume / named volume）はマウント先にディレクトリを自動生成するため、
`create-expo-app` がそれを検知して「ファイルが上書きされる可能性がある」と拒否する。

```
The directory app has files that might be overwritten:
  node_modules
```

**対処**: `create-expo-app` は使わず手動作成する。

---

### LANモードでスマートフォンから接続できない

同じWiFiでもつながらない場合、以下を確認する。

1. `ifconfig en0` のIPv4が `100.64.x.x` → CGNAT またはクライアント分離の可能性が高い → **Tunnelモードに切り替える**
2. `HOST_IP` に設定したIPとQRコードのURLのポートが一致しているか確認する
3. Macのファイアウォールがポートをブロックしていないかを確認する（システム設定 → ネットワーク → ファイアウォール）

---

### ngrok の tunnel が失敗する（remote gone away / session closed）

Expo の `--tunnel` フラグは内部で ngrok を使うが、大学・企業ネットワークでは ngrok への接続がブロックされ以下のエラーが出る。

```
CommandError: failed to start tunnel
remote gone away          ← ngrokサーバーへの接続がブロックされている
session closed            ← 認証トークンは通るが接続が切られる
```

`NGROK_AUTHTOKEN` を正しく設定しても発生する。

**対処**: Expo の `--tunnel` フラグは使わず、localtunnel を使った `start.sh` 方式に切り替える（手順1・手順4参照）。

---

### バンドルURLが localhost になってスマートフォンから接続できない

Tunnel 経由で Expo Go が接続できても、以下のエラーが出る場合がある。

```
could not connect to development server
URL: http://localhost:19000/App.tsx.bundle
```

Expo が生成するバンドルURLのホスト名が `localhost` のままになっているため、スマートフォンがそのURLにアクセスできない。

**原因**: `REACT_NATIVE_PACKAGER_HOSTNAME` 環境変数が設定されていない。

**対処**: `start.sh` 内で localtunnel のホスト名を取得し `REACT_NATIVE_PACKAGER_HOSTNAME` に渡す。
さらに Expo をポート **80** で起動することで、バンドルURLにポート番号が含まれなくなり localtunnel が正しく中継できる。

```sh
# ポート19000の場合（NG）: http://xxxx.loca.lt:19000/bundle → localtunnelが中継できない
# ポート80の場合（OK）:    http://xxxx.loca.lt/bundle       → localtunnelが中継できる
REACT_NATIVE_PACKAGER_HOSTNAME=$LT_HOST yarn expo start --lan --port 80
```

---

### Expo Go の SDK バージョンが合わない

Expo Go を最新版にアップデートすると、プロジェクトの SDK バージョンと合わなくなり起動時に以下のエラーが出る。

```
project is incompatible with this version of Expo Go.
the installed version of Expo Go is for SDK 54.0.0.
the project you opened uses SDK 51.
```

Expo Go のバージョンは下げられないため、**プロジェクト側の SDK を Expo Go に合わせて上げる**。

**対処**:

```bash
# 1. expo を対象 SDK バージョンに上げる（例: SDK 54 の場合）
docker compose run --rm app yarn add expo@~54.0.0

# 2. 依存パッケージを自動で正しいバージョンに更新する
docker compose run --rm app yarn expo install --fix

# 3. 再起動
docker compose up
```

`expo install --fix` が react・react-native・typescript など関連パッケージを SDK に合ったバージョンに自動更新してくれる。

---

### localtunnel の初回接続でIPアドレス入力を求められる

`https://xxxx.loca.lt` に初めてアクセスすると、アンチアビューズのためにIPアドレスの入力を求められる。

**対処**:
1. スマートフォンのブラウザで `https://api.ipify.org` を開いてグローバルIPを確認する
2. localtunnel のページにそのIPを入力して「Continue」をタップする
3. その後 Expo Go で `exp://xxxx.loca.lt` に接続する

`docker compose up` のたびに URL が変わるため、毎回この手順が必要。

---

## パッケージ追加方法

```bash
docker compose run --rm app yarn add <package-name>
```
