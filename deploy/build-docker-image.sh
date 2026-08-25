#!/bin/bash
# ==============================================================================
# 在 Ubuntu 编译机上执行：1. 容器内打包 -> 2. 构建 Docker 镜像 -> 3. 导出 tar 镜像包
# ==============================================================================

set -e

APP_NAME="datav-scada-app"
IMAGE_TAG="latest"
TAR_NAME="datav-scada-app.tar"

echo "========================================================"
echo "Step 1: 使用 Node 22.21.1 容器构建前端代码与 Electron Linux 解包程序..."
echo "========================================================"

docker run --rm \
  -v $(pwd):/app \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  -w /app \
  -e ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" \
  -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
  node:22.21.1-slim \
  /bin/bash -c "
    npm install -g pnpm && \
    pnpm install && \
    npx vite build && \
    npx esbuild electron/main.ts --bundle --platform=node --target=node20 --format=cjs --outfile=dist-electron/main.cjs --external:electron && \
    npx esbuild electron/preload.ts --bundle --platform=node --target=node20 --format=cjs --outfile=dist-electron/preload.cjs --external:electron && \
    npx electron-builder --config electron-builder.json5 --linux dir
  "

echo "========================================================"
echo "Step 2: 构建适合凝思 (Linx OS) 低版本工控机的 Docker 镜像..."
echo "========================================================"

docker build -t ${APP_NAME}:${IMAGE_TAG} .

echo "========================================================"
echo "Step 3: 导出 Docker 镜像为本地 tar 压缩包..."
echo "========================================================"

docker save ${APP_NAME}:${IMAGE_TAG} -o ${TAR_NAME}

echo "✅ 打包完成！已生成镜像归档文件: ${TAR_NAME}"
echo "👉 请执行以下命令传输至凝思工控机:"
echo "   scp ${TAR_NAME} root@<工控机IP>:/home/docker/datav-scada-deploy/"
