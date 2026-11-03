# Bộ Công Cụ Đầu Tư Chứng Khoán & Tài Chính (StockTool VN)

> 🌐 **Dùng trực tiếp trên web (Live Demo)**: [https://hoangdragon0245.github.io/projectlocal](https://hoangdragon0245.github.io/projectlocal)

Ứng dụng web toàn diện gồm 2 công cụ cốt lõi dành cho nhà đầu tư chứng khoán, crypto:

1. **📊 Máy tính giá bình quân (DCA Calculator)**: Quản lý nhiều lần mua gom với các mức giá và khối lượng khác nhau, tự động tính giá vốn bình quân gia quyền.
2. **📈 Tính lãi/lỗ & Thuế phí kèm Giá hòa vốn (Stock PnL)**: Tính toán chính xác lợi nhuận ròng sau khi trừ phí giao dịch mua/bán và thuế bán (0.1%), đồng thời tự động tính mức giá hòa vốn tối thiểu cần đặt lệnh.

---

## 🚀 Công nghệ sử dụng
- **Backend**: Node.js, Express.js (REST API, phục vụ Static Web)
- **Frontend**: HTML5, Modern CSS3 (Dark Mode & Light Mode), Vanilla JavaScript
- **Lưu trữ**: 
  - Server-side: `data/presets.json` (quản lý danh mục kịch bản)
  - Client-side: `LocalStorage` (lưu trạng thái phiên làm việc và cấu hình tiền tệ)

---

## 📦 Cài đặt và Khởi chạy

1. Cài đặt các thư viện cần thiết:
```bash
npm install
```

2. Khởi chạy máy chủ:
```bash
npm start
```

3. Mở trình duyệt và truy cập:
* 👉 **Máy tính giá bình quân (DCA)**: `http://localhost:3000/index.html`
* 👉 **Tính lãi/lỗ & Thuế phí, Giá hòa vốn**: `http://localhost:3000/stock-pnl.html`

---

## 💡 Các tính năng chính

### 1. Trang 1: Máy tính giá bình quân (DCA)
- Giao diện Dark Theme chuyên nghiệp.
- Nhập real-time, tự động tính tổng tiền và giá bình quân gia quyền.
- Thanh công cụ lưu/tải/xóa kịch bản danh mục (`💾`, `↻`, `☰`).
- Cài đặt tùy biến tiền tệ (`đ`, `$`, `€`, `USDT`) và định dạng số.

### 2. Trang 2: Tính lãi/lỗ chứng khoán & Giá hòa vốn
- **Công tắc thông minh**:
  - `Mua nhiều đợt (trung bình giá vốn)`: Gạt ON để mở rộng bảng mua nhiều đợt và tự động tính giá vốn TB.
  - `Đã bán chưa?`: Gạt ON tính lãi lỗ thực tế; Gạt OFF tính lãi lỗ tạm tính theo giá thị trường.
- **Phí & Thuế**:
  - Phí mua (%) (mặc định 0.2%)
  - Phí bán (%) (mặc định 0.2%)
  - Thuế bán chứng khoán (%) (mặc định 0.1% theo luật thuế TNCN Việt Nam).
- **Kết quả nổi bật**:
  - `Lãi / Lỗ` (hiển thị màu xanh nếu lãi, màu đỏ nếu lỗ).
  - `Tỷ suất lãi / lỗ (%)`.
  - `Giá hòa vốn (bán tối thiểu)`: Công thức $P_{breakeven} = \frac{C_{out}}{Q \times (1 - \text{phí bán} - \text{thuế bán})}$.
- **Bảng chi tiết dòng tiền**: Minh bạch 10 khoản mục tiền mua, phí mua, tổng vốn, tiền bán, phí bán, thuế bán, tiền thực thu và lãi ròng.
- **Hỗ trợ giao diện Sáng / Tối**: Nút chuyển đổi `🌓` linh hoạt trên thanh điều hướng.
