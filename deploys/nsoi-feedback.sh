#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- 环境检查与自动安装 ---
install_tool() {
    local tool_name=$1
    local apt_package=$2
    local yum_package=$3

    if ! command -v "$tool_name" &> /dev/null; then
        echo "警告: $tool_name 未安装。尝试自动安装 $tool_name (主要针对 Debian/Ubuntu 或 CentOS/RHEL)..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y "$apt_package"
        elif command -v yum &> /dev/null; then
            sudo yum install -y "$yum_package"
        else
            echo "错误: 无法自动安装 $tool_name。请手动安装 $tool_name 后重试。"
            exit 1
        fi
    fi
}

echo "检查必要的工具并尝试自动安装..."
install_tool git git git
install_tool docker docker.io docker
install_tool docker-compose docker-compose docker-compose
echo "所有必要的工具都已安装或已尝试安装。"

# --- Git 仓库拉取 ---
REPO_URL="https://github.com/SuperUseryjh/NSOI-feedback.git"
PROJECT_DIR="NSOI-feedback"

if [ -d "$PROJECT_DIR" ]; then
    echo "项目目录 $PROJECT_DIR 已存在，尝试拉取最新代码..."
    cd "$PROJECT_DIR"
    git pull
    cd ..
else
    echo "克隆 Git 仓库 $REPO_URL..."
    git clone "$REPO_URL"
fi

cd "$PROJECT_DIR"

# --- 交互式设置应用运行端口 ---
read -p "请输入应用运行端口 (默认为 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}

# --- 交互式设置管理员凭据 ---
read -p "请输入管理员用户名 (默认为 admin): " ADMIN_USERNAME
ADMIN_USERNAME=${ADMIN_USERNAME:-admin}

read -s -p "请输入管理员密码: " ADMIN_PASSWORD
echo
read -s -p "请再次输入管理员密码以确认: " ADMIN_PASSWORD_CONFIRM
echo

while [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ] || [ -z "$ADMIN_PASSWORD" ]; do
    echo "密码不匹配或为空，请重新输入。"
    read -s -p "请输入管理员密码: " ADMIN_PASSWORD
    echo
    read -s -p "请再次输入管理员密码以确认: " ADMIN_PASSWORD_CONFIRM
    echo
done

# --- 自动生成 Redis 密码 ---
REDIS_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 16)
echo "已为 Redis 自动生成密码: $REDIS_PASSWORD"

# --- 生成 .env 文件 ---
echo "生成 .env 文件..."
cat << EOF > .env
PORT=${APP_PORT}
SECRET_KEY=$(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 32)
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
EOF

# --- 更新 docker-compose.yml 中的端口映射 ---
echo "更新 docker-compose.yml 中的端口映射..."
sed -i "/- \"3000:3000\"/c\      - \"${APP_PORT}:3000\"" docker-compose.yml

echo "停止现有 Docker Compose 服务..."
docker-compose down

echo "构建 Docker 镜像..."
docker-compose build

echo "启动 Docker Compose 服务..."
docker-compose up -d

echo "部署完成！"
echo "应用将在端口 ${APP_PORT} 上运行。"
echo "管理员用户名: ${ADMIN_USERNAME}"
echo "管理员密码: ${ADMIN_PASSWORD}"
echo "Redis 密码: ${REDIS_PASSWORD}"
echo "请妥善保管这些凭据。"


