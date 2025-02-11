#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查命令是否执行成功
check_result() {
    if [ $? -ne 0 ]; then
        print_message "$RED" "错误：$1"
        exit 1
    fi
}

# 检查是否有未提交的更改
check_changes() {
    if [ -z "$(git status --porcelain)" ]; then
        print_message "$YELLOW" "没有需要提交的更改"
        exit 0
    fi
}

# 检查远程仓库URL是否为SSH
check_ssh_url() {
    local remote_url=$(git remote get-url origin 2>/dev/null)
    if [ $? -ne 0 ]; then
        print_message "$RED" "错误：未找到远程仓库 'origin'"
        exit 1
    fi

    if [[ $remote_url != git@* ]]; then
        print_message "$RED" "错误：请使用SSH URL (git@github.com:...)"
        print_message "$YELLOW" "当前URL: $remote_url"
        print_message "$YELLOW" "请使用以下命令设置SSH URL："
        print_message "$YELLOW" "git remote set-url origin git@github.com:用户名/仓库名.git"
        exit 1
    fi
}

# 检查并创建提交消息
create_commit_message() {
    local default_type="docs"
    local commit_type=$1
    local commit_message=$2

    # 如果没有提供提交类型，使用默认类型
    if [ -z "$commit_type" ]; then
        print_message "$YELLOW" "未指定提交类型，使用默认类型：$default_type"
        commit_type=$default_type
    fi

    # 如果没有提供提交消息，提示输入
    if [ -z "$commit_message" ]; then
        read -p "请输入提交消息: " commit_message
        while [ -z "$commit_message" ]; do
            print_message "$RED" "提交消息不能为空"
            read -p "请输入提交消息: " commit_message
        done
    fi

    echo "${commit_type}: ${commit_message}"
}

# 主函数
main() {
    # 检查是否在git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_message "$RED" "错误：当前目录不是git仓库"
        exit 1
    fi

    # 检查是否有更改
    check_changes

    # 检查是否使用SSH URL
    check_ssh_url

    # 获取当前分支名
    local current_branch=$(git branch --show-current)
    print_message "$GREEN" "当前分支：$current_branch"

    # 处理命令行参数
    local commit_type=$1
    local commit_message=$2
    local commit_full_message=$(create_commit_message "$commit_type" "$commit_message")

    # 添加所有更改
    print_message "$GREEN" "添加更改..."
    git add .
    check_result "添加更改失败"

    # 创建提交
    print_message "$GREEN" "创建提交..."
    git commit -m "$commit_full_message"
    check_result "创建提交失败"

    # 拉取最新代码
    print_message "$GREEN" "拉取最新代码..."
    git pull --rebase origin $current_branch
    check_result "拉取最新代码失败"

    # 推送更改
    print_message "$GREEN" "推送更改..."
    git push origin $current_branch
    check_result "推送更改失败"

    print_message "$GREEN" "完成！成功推送到 $current_branch 分支"
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [commit_type] [commit_message]"
    echo "示例:"
    echo "  $0                       # 使用交互式提示"
    echo "  $0 feat '添加新功能'     # 指定提交类型和消息"
    echo "  $0 fix '修复bug'        # 指定提交类型和消息"
    echo
    echo "提交类型:"
    echo "  feat     - 新功能"
    echo "  fix      - 修复bug"
    echo "  docs     - 文档更新"
    echo "  style    - 代码格式修改"
    echo "  refactor - 代码重构"
    echo "  test     - 测试用例修改"
    echo "  chore    - 其他修改"
}

# 如果带有-h或--help参数，显示使用说明
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    show_usage
    exit 0
fi

# 执行主函数
main "$@"
