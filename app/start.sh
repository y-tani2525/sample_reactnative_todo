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
