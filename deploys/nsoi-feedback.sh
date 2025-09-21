#!/bin/bash

# 默认配置
REPO_URL="https://github.com/SuperUseryjh/NSOI-feedback.git"
APP_DIR="NSOI-feedback"
CONTAINER_NAME="feedback-box-container"
IMAGE_NAME="feedback-box"
DEFAULT_PORT="5000"
DEFAULT_ADMIN_USERNAME="admin"
DEFAULT_ADMIN_PASSWORD="password"

# 辅助函数：检查并安装 Git
install_git() {
    if ! command -v git &> /dev/null
    then
        echo "Git 未安装，正在安装..."
        sudo apt update
        sudo apt install -y git
        if [ $? -ne 0 ]; then
            echo "错误: Git 安装失败。"
            exit 1
        fi
    fi
}

# 辅助函数：检查并安装 Docker
install_docker() {
    if ! command -v docker &> /dev/null
    then
        echo "Docker 未安装，正在安装..."
        sudo apt update
        sudo apt install -y docker.io
        if [ $? -ne 0 ]; then
            echo "错误: Docker 安装失败。"
            exit 1
        fi
        sudo usermod -aG docker ${USER}
        echo "Docker 已安装。请注销并重新登录，或运行 'newgrp docker' 以使更改生效。"
        newgrp docker || true
    fi
}

# 辅助函数：停止并删除容器
stop_and_remove_container() {
    echo "停止并删除旧的 Docker 容器 (如果存在)..."
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop ${CONTAINER_NAME}
        docker rm ${CONTAINER_NAME}
        echo "旧容器已停止并删除。"
    else
        echo "没有找到名为 ${CONTAINER_NAME} 的旧容器。"
    fi
}

# 辅助函数：删除应用目录
remove_app_directory() {
    echo "删除旧的仓库目录 (如果存在)..."
    if [ -d "${APP_DIR}" ]; then
        rm -rf "${APP_DIR}"
        echo "旧目录 ${APP_DIR} 已删除。"
    else
        echo "没有找到旧目录 ${APP_DIR}。"
    fi
}

# 辅助函数：删除 Docker 镜像
remove_docker_image() {
    echo "删除 Docker 镜像 (如果存在)..."
    if docker images --format '{{.Repository}}' | grep -q "^${IMAGE_NAME}$"; then
        docker rmi ${IMAGE_NAME}
        echo "Docker 镜像 ${IMAGE_NAME} 已删除。"
    else
        echo "没有找到名为 ${IMAGE_NAME} 的 Docker 镜像。"
    fi
}

# 安装功能
install_app() {
    echo "--- 开始安装意见箱应用 ---"

    # 交互式获取配置
    read -p "请输入应用运行的端口 (默认为 ${DEFAULT_PORT}): " PORT
    PORT=${PORT:-$DEFAULT_PORT}

    read -p "请输入管理员用户名 (默认为 ${DEFAULT_ADMIN_USERNAME}): " ADMIN_USERNAME
    ADMIN_USERNAME=${ADMIN_USERNAME:-$DEFAULT_ADMIN_USERNAME}

    read -s -p "请输入管理员密码 (默认为 ${DEFAULT_ADMIN_PASSWORD}): " ADMIN_PASSWORD
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-$DEFAULT_ADMIN_PASSWORD}
    echo ""

    SECRET_KEY=$(head /dev/urandom | tr -dc A-Za-z0-9_.- | head -c 32)

    echo "使用的端口: ${PORT}"
    echo "管理员用户名: ${ADMIN_USERNAME}"
    echo "管理员密码: ${ADMIN_PASSWORD}"

    install_git
    install_docker

    stop_and_remove_container
    remove_app_directory

    echo "克隆 Git 仓库 ${REPO_URL}..."
    git clone ${REPO_URL}
    if [ $? -ne 0 ]; then
        echo "错误: 克隆仓库失败。"
        exit 1
    fi

    echo "进入应用目录 ${APP_DIR}..."
    cd ${APP_DIR}
    if [ $? -ne 0 ]; then
        echo "错误: 无法进入目录 ${APP_DIR}。"
        exit 1
    fi

    echo "构建 Docker 镜像 ${IMAGE_NAME}..."
    docker build -t ${IMAGE_NAME} .
    if [ $? -ne 0 ]; then
        echo "错误: Docker 镜像构建失败。"
        exit 1
    fi

    echo "运行 Docker 容器 ${CONTAINER_NAME}，映射端口 ${PORT}:${PORT}..."
    docker run -d \
        -p ${PORT}:${PORT} \
        --name ${CONTAINER_NAME} \
        -e SECRET_KEY="${SECRET_KEY}" \
        -e ADMIN_USERNAME="${ADMIN_USERNAME}" \
        -e ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
        ${IMAGE_NAME}
    if [ $? -ne 0 ]; then
        echo "错误: Docker 容器运行失败。"
        exit 1
    fi

    echo "--- 安装完成！ ---"
    echo "意见箱应用现在应该在端口 ${PORT} 上运行。"
    echo "您可以通过访问 http://您的服务器IP:${PORT} 来访问它。"
    echo "管理员登录信息: 用户名: ${ADMIN_USERNAME}, 密码: ${ADMIN_PASSWORD}"
}

# 更新功能
update_app() {
    echo "--- 开始更新意见箱应用 ---"

    install_git
    install_docker

    stop_and_remove_container

    if [ ! -d "${APP_DIR}" ]; then
        echo "错误: 应用目录 ${APP_DIR} 不存在。请先安装应用。"
        return 1
    fi

    echo "进入应用目录 ${APP_DIR}..."
    cd ${APP_DIR}
    if [ $? -ne 0 ]; then
        echo "错误: 无法进入目录 ${APP_DIR}。"
        exit 1
    fi

    echo "拉取最新代码..."
    git pull origin master
    if [ $? -ne 0 ]; then
        echo "错误: 拉取最新代码失败。"
        exit 1
    fi

    echo "重新构建 Docker 镜像 ${IMAGE_NAME}..."
    docker build -t ${IMAGE_NAME} .
    if [ $? -ne 0 ]; then
        echo "错误: Docker 镜像重新构建失败。"
        exit 1
    fi

    # 尝试获取旧的端口和管理员信息，如果容器存在
    CURRENT_PORT=$(docker port ${CONTAINER_NAME} | cut -d ':' -f 2 | cut -d '/' -f 1)
    if [ -z "$CURRENT_PORT" ]; then
        CURRENT_PORT=${DEFAULT_PORT}
    fi

    # 重新运行容器，使用旧的或默认的配置
    echo "重新运行 Docker 容器 ${CONTAINER_NAME}，映射端口 ${CURRENT_PORT}:${CURRENT_PORT}..."
    docker run -d \
        -p ${CURRENT_PORT}:${CURRENT_PORT} \
        --name ${CONTAINER_NAME} \
        -e SECRET_KEY="$(head /dev/urandom | tr -dc A-Za-z0-9_.- | head -c 32)" \
        -e ADMIN_USERNAME="${ADMIN_USERNAME}" \
        -e ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
        ${IMAGE_NAME}
    if [ $? -ne 0 ]; then
        echo "错误: Docker 容器重新运行失败。"
        exit 1
    fi

    echo "--- 更新完成！ ---"
    echo "意见箱应用现在应该在端口 ${CURRENT_PORT} 上运行。"
    echo "您可以通过访问 http://您的服务器IP:${CURRENT_PORT} 来访问它。"
    echo "管理员登录信息: 用户名: ${ADMIN_USERNAME}, 密码: ${ADMIN_PASSWORD}"
}

# 卸载功能
uninstall_app() {
    echo "--- 开始卸载意见箱应用 ---"

    stop_and_remove_container
    remove_app_directory
    remove_docker_image

    echo "--- 卸载完成！ ---"
    echo "意见箱应用已从您的系统移除。"
}

# 主菜单
main_menu() {
    while true; do
        echo "\n--- 意见箱应用管理 ---"
        echo "1. 安装应用"
        echo "2. 更新应用"
        echo "3. 卸载应用"
        echo "4. 退出"
        read -p "请选择一个操作 (1-4): " choice

        case $choice in
            1)
                install_app
                ;;
            2)
                update_app
                ;;
            3)
                uninstall_app
                ;;
            4)
                echo "退出。"
                exit 0
                ;;
            *)
                echo "无效的选择，请重新输入。"
                ;;
        esac
    done
}

# 运行主菜单
main_menu
