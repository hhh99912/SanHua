#!/bin/bash
# ==============================================================================
# 在 凝思工控机 (Linx OS) 上执行：加载镜像并启动 SCADA 工业大屏 GUI 容器
# ==============================================================================

set -e

TAR_FILE="datav-scada-app.tar"
IMAGE_NAME="datav-scada-app:latest"
CONTAINER_NAME="datav-scada-instance"

# 1. 允许本地 root 用户访问 X11 桌面会话（工业机显示屏必配）
echo "1. 开放本地 X11 显示权限..."
xhost +local:root || true

# 2. 导入镜像
if [ -f "$TAR_FILE" ]; then
  echo "2. 加载镜像文件 $TAR_FILE ..."
  docker load -i $TAR_FILE
fi

# 3. 停止并清理旧容器实例
if [ $(docker ps -aq -f name=${CONTAINER_NAME}) ]; then
  echo "3. 停止并移除已存在的同名容器..."
  docker stop ${CONTAINER_NAME} || true
  docker rm ${CONTAINER_NAME} || true
fi

# 4. 运行大屏 GUI 容器
# 核心关键参数说明：
# -v /tmp/.X11-unix:/tmp/.X11-unix : 映射主机 X11 图形界面 Socket
# -e DISPLAY=$DISPLAY              : 传递当前物理屏显示通道
# --ipc=host 或 --shm-size=2gb      : 规避 Docker 默认 64MB 共享内存导致 Canvas 崩溃
# --privileged 或 --device /dev/dri: 启用显卡硬件渲染加速 (若工控机有显卡)
echo "4. 启动 SCADA 工业组态大屏桌面容器..."

docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  --net=host \
  --ipc=host \
  --shm-size=2gb \
  -e DISPLAY=${DISPLAY:-:0} \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v /dev/dri:/dev/dri \
  --privileged \
  ${IMAGE_NAME}

echo "✅ SCADA 大屏客户端已在凝思系统屏幕上启动成功！"
