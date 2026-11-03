/**
 * Calculator module - Xử lý tính toán DCA và định dạng số/tiền tệ
 */

// Cấu hình tiền tệ mặc định theo chuẩn VNĐ như trong ảnh mẫu
const defaultCurrencySettings = {
  symbol: 'đ',
  thousandSep: '.',
  decimalSep: ',',
  maxDecimals: 0,       // Mặc định 0 chữ số lẻ cho VNĐ (VD: 221.667 đ)
  autoDecimals: true,
};

class DCACalculator {
  constructor(settings = {}) {
    this.settings = { ...defaultCurrencySettings, ...settings };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Chuyển chuỗi định dạng (vd: "231.000" hoặc "221,667") thành số Number
   */
  parseNumber(str) {
    if (str === null || str === undefined) return 0;
    if (typeof str === 'number') return isNaN(str) ? 0 : str;

    let cleanStr = str.toString().trim();
    if (!cleanStr) return 0;

    // Loại bỏ khoảng trắng và ký hiệu tiền tệ
    cleanStr = cleanStr.replace(new RegExp(`\\${this.settings.symbol}`, 'g'), '').trim();

    // Loại bỏ dấu phân cách hàng nghìn
    cleanStr = cleanStr.split(this.settings.thousandSep).join('');

    // Đổi dấu thập phân sang dấu chấm tiêu chuẩn JS
    if (this.settings.decimalSep !== '.') {
      cleanStr = cleanStr.replace(this.settings.decimalSep, '.');
    }

    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Định dạng số thành chuỗi có dấu phân cách hàng nghìn và thập phân
   * @param {number} num Số cần format
   * @param {number|null} forceDecimals Ép buộc số lượng chữ số thập phân (null = tự động)
   */
  formatNumber(num, forceDecimals = null) {
    if (num === null || num === undefined || isNaN(num)) return '';
    if (num === 0) return '0';

    const thousandSep = this.settings.thousandSep;
    const decimalSep = this.settings.decimalSep;

    let targetDecimals;
    if (forceDecimals !== null) {
      targetDecimals = forceDecimals;
    } else {
      // Kiểm tra nếu là số nguyên
      const isInteger = Number.isInteger(num);
      if (isInteger && this.settings.autoDecimals) {
        targetDecimals = 0;
      } else {
        targetDecimals = this.settings.maxDecimals;
      }
    }

    // Làm tròn an toàn tránh floating-point sai số
    const factor = Math.pow(10, targetDecimals);
    const rounded = Math.round((num + Number.EPSILON) * factor) / factor;

    // Tách phần nguyên và phần thập phân
    const parts = rounded.toFixed(targetDecimals).split('.');
    let intPart = parts[0];
    let decPart = parts[1];

    // Thêm dấu phân cách hàng nghìn
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

    // Nếu tự động và phần thập phân toàn số 0 thì bỏ qua
    if (targetDecimals > 0 && this.settings.autoDecimals) {
      decPart = decPart.replace(/0+$/, ''); // Bỏ các số 0 thừa ở cuối
      if (!decPart) {
        return intPart;
      }
    }

    return targetDecimals > 0 && decPart ? `${intPart}${decimalSep}${decPart}` : intPart;
  }

  /**
   * Định dạng tiền kèm ký hiệu
   */
  formatCurrency(num, forceDecimals = null) {
    const formatted = this.formatNumber(num, forceDecimals);
    return formatted ? `${formatted}${this.settings.symbol}` : '';
  }

  /**
   * Tính toán DCA cho danh sách các dòng mua
   * @param {Array<{price: number|string, quantity: number|string}>} rows
   */
  calculate(rows) {
    let totalQuantity = 0;
    let totalCost = 0;

    const calculatedRows = rows.map((row, index) => {
      const price = this.parseNumber(row.price);
      const quantity = this.parseNumber(row.quantity);
      
      const hasPrice = row.price !== '' && row.price !== null && !isNaN(price) && price > 0;
      const hasQuantity = row.quantity !== '' && row.quantity !== null && !isNaN(quantity) && quantity > 0;

      let subtotal = 0;
      if (hasPrice && hasQuantity) {
        subtotal = price * quantity;
        totalQuantity += quantity;
        totalCost += subtotal;
      }

      return {
        index: index + 1,
        price,
        quantity,
        subtotal,
        isValid: hasPrice && hasQuantity,
        isEmpty: !hasPrice && !hasQuantity
      };
    });

    const averagePrice = totalQuantity > 0 ? (totalCost / totalQuantity) : 0;

    return {
      rows: calculatedRows,
      totalQuantity,
      totalCost,
      averagePrice
    };
  }
}

// Xuất nếu chạy trong môi trường Node.js (cho testing) hoặc gắn vào window (trình duyệt)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DCACalculator, defaultCurrencySettings };
} else {
  window.DCACalculator = DCACalculator;
  window.defaultCurrencySettings = defaultCurrencySettings;
}
