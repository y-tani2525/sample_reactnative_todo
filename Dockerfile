FROM node:20-alpine

RUN apk add --no-cache git curl

# cloudflared をアーキテクチャに合わせてインストール
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then CF_ARCH="arm64"; else CF_ARCH="amd64"; fi && \
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" \
    -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

# corepack で yarn を有効化
RUN corepack enable && corepack prepare yarn@stable --activate

WORKDIR /app

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

EXPOSE 19000
EXPOSE 19001

CMD ["sh", "/app/start.sh"]
