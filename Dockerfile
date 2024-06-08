FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . .

# 安装pnpm
RUN npm install -g pnpm

# 安装项目依赖
RUN pnpm install

# 运行项目
CMD ["pnpm", "start"]