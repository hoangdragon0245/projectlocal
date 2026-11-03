# ==========================================
# Dockerfile cho StockTool VN (DCA & Stock PnL)
# Base image nhẹ, bảo mật với Node.js Alpine
# ==========================================

FROM node:22-alpine AS runner

# Đặt biến môi trường
ENV NODE_ENV=production
ENV PORT=3000

# Thư mục làm việc trong container
WORKDIR /app

# Cài đặt curl cho HEALTHCHECK
RUN apk add --no-cache curl

# Copy manifest dependencies
COPY package*.json ./

# Cài đặt dependencies môi trường production
RUN npm ci --omit=dev

# Copy toàn bộ mã nguồn
COPY server.js ./
COPY public ./public
COPY data ./data

# Tạo thư mục data và cấp quyền cho user node
RUN chown -R node:node /app

# Sử dụng non-root user để tăng tính bảo mật
USER node

# Khai báo volume lưu trữ dữ liệu kịch bản lâu dài
VOLUME ["/app/data"]

# Mở cổng 3000
EXPOSE 3000

# Kiểm tra trạng thái hoạt động (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/presets || exit 1

# Khởi chạy ứng dụng
CMD ["node", "server.js"]
