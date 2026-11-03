/**
 * Stock PnL Calculator Logic & DOM Controller
 * Tính lãi/lỗ mua bán chứng khoán, thuế phí & giá hòa vốn
 */

class StockPnLCalculator {
  constructor() {
    this.state = {
      // Inputs
      isDCA: false,
      buyPrice: 221667,
      buyQuantity: 300,
      isSold: true,
      sellPrice: 241000,
      feeBuyPercent: 0.2,
      feeSellPercent: 0.2,
      taxSellPercent: 0.1,

      // Multi-buy DCA rows (khi bật chế độ mua nhiều đợt)
      dcaRows: [
        { price: 231000, quantity: 100 },
        { price: 217000, quantity: 200 }
      ]
    };
  }

  // Parse số an toàn từ chuỗi (hỗ trợ dấu . hàng nghìn và dấu , thập phân)
  parseInputNumber(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let s = val.toString().trim();
    // Bỏ ký tự không phải số, dấu chấm, dấu phẩy
    s = s.replace(/[^0-9.,-]/g, '');
    // Nếu có cả . và , thì . là hàng nghìn, , là thập phân (chuẩn VN)
    if (s.includes('.') && s.includes(',')) {
      s = s.split('.').join('').replace(',', '.');
    } else if (s.includes('.') && !s.includes(',')) {
      // Trường hợp chỉ có dấu . (221.667 hoặc 231.000)
      s = s.split('.').join('');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  // Format số nguyên thành chuỗi có dấu chấm hàng nghìn
  formatMoney(num) {
    if (num === null || num === undefined || isNaN(num)) return '0đ';
    const rounded = Math.round(num);
    const formatted = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (rounded < 0 ? '-' : '') + formatted + 'đ';
  }

  formatPercent(num) {
    if (num === null || num === undefined || isNaN(num)) return '0,00%';
    const fixed = Math.abs(num).toFixed(2).replace('.', ',');
    const sign = num > 0 ? '+' : (num < 0 ? '-' : '');
    return `${sign}${fixed}%`;
  }

  // Tính toán DCA cho danh sách nhiều đợt
  computeDCA() {
    let totalQty = 0;
    let totalCost = 0;
    this.state.dcaRows.forEach(row => {
      const p = this.parseInputNumber(row.price);
      const q = this.parseInputNumber(row.quantity);
      if (p > 0 && q > 0) {
        totalCost += p * q;
        totalQty += q;
      }
    });
    const avgPrice = totalQty > 0 ? Math.round(totalCost / totalQty) : 0;
    return { avgPrice, totalQty, totalCost };
  }

  // Tính toán toàn bộ thông số PnL
  calculate() {
    let buyPrice = this.state.buyPrice;
    let buyQuantity = this.state.buyQuantity;

    if (this.state.isDCA) {
      const dca = this.computeDCA();
      buyPrice = dca.avgPrice;
      buyQuantity = dca.totalQty;
    }

    const sellPrice = this.state.sellPrice;
    const feeBuyRate = this.state.feeBuyPercent / 100;
    const feeSellRate = this.state.feeSellPercent / 100;
    const taxSellRate = this.state.taxSellPercent / 100;

    // 1. Chiều mua
    const stockBuyCost = buyPrice * buyQuantity;
    const feeBuy = Math.round(stockBuyCost * feeBuyRate);
    const totalBuyCapital = stockBuyCost + feeBuy;

    // 2. Chiều bán
    const stockSellRevenue = sellPrice * buyQuantity;
    const feeSell = Math.round(stockSellRevenue * feeSellRate);
    const taxSell = Math.round(stockSellRevenue * taxSellRate);
    const totalSellNet = stockSellRevenue - feeSell - taxSell;

    // 3. Lãi lỗ & Tỷ suất
    const netProfit = totalSellNet - totalBuyCapital;
    const profitRate = totalBuyCapital > 0 ? (netProfit / totalBuyCapital) * 100 : 0;

    // 4. Giá hòa vốn (Breakeven Price)
    // C_out = (P_break * Q) * (1 - feeSellRate - taxSellRate)
    const effectiveSellRate = 1 - feeSellRate - taxSellRate;
    let breakevenPrice = 0;
    if (buyQuantity > 0 && effectiveSellRate > 0) {
      breakevenPrice = Math.round(totalBuyCapital / (buyQuantity * effectiveSellRate));
    }

    return {
      buyPrice,
      buyQuantity,
      sellPrice,
      feeBuyRate,
      feeSellRate,
      taxSellRate,
      stockBuyCost,
      feeBuy,
      totalBuyCapital,
      stockSellRevenue,
      feeSell,
      taxSell,
      totalSellNet,
      netProfit,
      profitRate,
      breakevenPrice
    };
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const pnlCalc = new StockPnLCalculator();

  // Inputs
  const toggleDCA = document.getElementById('toggle-dca');
  const dcaContainer = document.getElementById('dca-multi-container');
  const singleBuyContainer = document.getElementById('single-buy-container');
  const inputBuyPrice = document.getElementById('input-buy-price');
  const inputBuyQty = document.getElementById('input-buy-qty');
  const toggleSold = document.getElementById('toggle-sold');
  const labelSellPrice = document.getElementById('label-sell-price');
  const inputSellPrice = document.getElementById('input-sell-price');

  const inputFeeBuy = document.getElementById('input-fee-buy');
  const inputFeeSell = document.getElementById('input-fee-sell');
  const inputTaxSell = document.getElementById('input-tax-sell');

  // DCA Table Elements
  const dcaTableBody = document.getElementById('dca-table-body');
  const btnAddDcaRow = document.getElementById('btn-add-dca-row');

  // Summary Elements inside Right Card
  const displayTotalBuy = document.getElementById('display-total-buy');
  const detailTotalBuy = document.getElementById('detail-total-buy');
  const displayTotalSell = document.getElementById('display-total-sell');
  const detailTotalSell = document.getElementById('detail-total-sell');

  // 3 Middle Result Cards
  const cardProfitVal = document.getElementById('card-profit-val');
  const cardProfitRate = document.getElementById('card-profit-rate');
  const cardBreakeven = document.getElementById('card-breakeven-price');

  // Breakdown Table Elements
  const tbQty = document.getElementById('tb-qty');
  const tbAvgPrice = document.getElementById('tb-avg-price');
  const tbBuyCost = document.getElementById('tb-buy-cost');
  const tbFeeBuy = document.getElementById('tb-fee-buy');
  const tbTotalBuy = document.getElementById('tb-total-buy');
  const tbSellRevenue = document.getElementById('tb-sell-revenue');
  const tbFeeSell = document.getElementById('tb-fee-sell');
  const tbTaxSell = document.getElementById('tb-tax-sell');
  const tbTotalSell = document.getElementById('tb-total-sell');
  const tbNetProfit = document.getElementById('tb-net-profit');

  // Cập nhật giao diện tính toán
  function updateUI() {
    const res = pnlCalc.calculate();

    // 1. Khung bên phải
    displayTotalBuy.textContent = pnlCalc.formatMoney(res.totalBuyCapital);
    detailTotalBuy.textContent = `${pnlCalc.formatMoney(res.stockBuyCost)} tiền cổ phiếu + ${pnlCalc.formatMoney(res.feeBuy)} phí mua`;

    displayTotalSell.textContent = pnlCalc.formatMoney(res.totalSellNet);
    detailTotalSell.textContent = `${pnlCalc.formatMoney(res.stockSellRevenue)} tiền bán – ${pnlCalc.formatMoney(res.feeSell)} phí bán – ${pnlCalc.formatMoney(res.taxSell)} thuế bán`;

    // 2. 3 Cards kết quả
    const isProfit = res.netProfit >= 0;
    const profitColorClass = isProfit ? 'text-profit' : 'text-loss';
    const profitSign = isProfit ? '+' : '';

    cardProfitVal.className = `metric-value ${profitColorClass}`;
    cardProfitVal.textContent = profitSign + pnlCalc.formatMoney(res.netProfit);

    cardProfitRate.className = `metric-value ${profitColorClass}`;
    cardProfitRate.textContent = pnlCalc.formatPercent(res.profitRate);

    cardBreakeven.textContent = pnlCalc.formatMoney(res.breakevenPrice);

    // 3. Bảng chi tiết dòng tiền
    tbQty.textContent = `${res.buyQuantity.toLocaleString('vi-VN')} cổ phiếu`;
    tbAvgPrice.textContent = pnlCalc.formatMoney(res.buyPrice);
    tbBuyCost.textContent = pnlCalc.formatMoney(res.stockBuyCost);
    tbFeeBuy.textContent = `-${pnlCalc.formatMoney(res.feeBuy)}`;
    tbTotalBuy.textContent = pnlCalc.formatMoney(res.totalBuyCapital);
    tbSellRevenue.textContent = pnlCalc.formatMoney(res.stockSellRevenue);
    tbFeeSell.textContent = `-${pnlCalc.formatMoney(res.feeSell)}`;
    tbTaxSell.textContent = `-${pnlCalc.formatMoney(res.taxSell)}`;
    tbTotalSell.textContent = pnlCalc.formatMoney(res.totalSellNet);

    tbNetProfit.className = `tb-val font-bold ${profitColorClass}`;
    tbNetProfit.textContent = profitSign + pnlCalc.formatMoney(res.netProfit);
  }

  // Quản lý bảng DCA trong trường hợp bật Mua nhiều đợt
  function renderDCARows() {
    dcaTableBody.innerHTML = '';
    pnlCalc.state.dcaRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align:center; color:#6b7280; font-size:13px;">${idx + 1}.</td>
        <td>
          <input type="text" class="form-input dca-price" data-index="${idx}" value="${row.price ? row.price.toLocaleString('vi-VN') : ''}" placeholder="Giá mua" style="text-align:right;">
        </td>
        <td style="text-align:center; color:#9ca3af;">x</td>
        <td>
          <input type="number" class="form-input dca-qty" data-index="${idx}" value="${row.quantity || ''}" placeholder="Số lượng" style="text-align:right;">
        </td>
        <td>
          <button type="button" class="btn-dca-remove" data-index="${idx}" title="Xóa dòng" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:16px;">×</button>
        </td>
      `;
      dcaTableBody.appendChild(tr);
    });

    const dca = pnlCalc.computeDCA();
    const dcaSummaryEl = document.getElementById('dca-summary-note');
    if (dcaSummaryEl) {
      dcaSummaryEl.textContent = `Giá TB: ${pnlCalc.formatMoney(dca.avgPrice)} | Tổng lượng: ${dca.totalQty.toLocaleString('vi-VN')} CP`;
    }
    updateUI();
  }

  // Sự kiện toggle Mua nhiều đợt
  toggleDCA.addEventListener('change', (e) => {
    pnlCalc.state.isDCA = e.target.checked;
    if (pnlCalc.state.isDCA) {
      dcaContainer.classList.remove('hidden');
      singleBuyContainer.classList.add('hidden');
      renderDCARows();
    } else {
      dcaContainer.classList.add('hidden');
      singleBuyContainer.classList.remove('hidden');
      updateUI();
    }
  });

  // Sự kiện toggle Đã bán chưa
  toggleSold.addEventListener('change', (e) => {
    pnlCalc.state.isSold = e.target.checked;
    if (pnlCalc.state.isSold) {
      labelSellPrice.textContent = 'Giá bán / cổ phiếu (đồng)';
    } else {
      labelSellPrice.textContent = 'Giá thị trường hiện tại (đồng)';
    }
    updateUI();
  });

  // Sự kiện nhập liệu các ô đơn lẻ
  inputBuyPrice.addEventListener('input', (e) => {
    pnlCalc.state.buyPrice = pnlCalc.parseInputNumber(e.target.value);
    updateUI();
  });

  inputBuyPrice.addEventListener('blur', (e) => {
    if (pnlCalc.state.buyPrice > 0) {
      e.target.value = pnlCalc.state.buyPrice.toLocaleString('vi-VN');
    }
  });

  inputBuyQty.addEventListener('input', (e) => {
    pnlCalc.state.buyQuantity = pnlCalc.parseInputNumber(e.target.value);
    updateUI();
  });

  inputSellPrice.addEventListener('input', (e) => {
    pnlCalc.state.sellPrice = pnlCalc.parseInputNumber(e.target.value);
    updateUI();
  });

  inputSellPrice.addEventListener('blur', (e) => {
    if (pnlCalc.state.sellPrice > 0) {
      e.target.value = pnlCalc.state.sellPrice.toLocaleString('vi-VN');
    }
  });

  inputFeeBuy.addEventListener('input', (e) => {
    pnlCalc.state.feeBuyPercent = pnlCalc.parseInputNumber(e.target.value);
    updateUI();
  });

  inputFeeSell.addEventListener('input', (e) => {
    pnlCalc.state.feeSellPercent = pnlCalc.parseInputNumber(e.target.value);
    updateUI();
  });

  inputTaxSell.addEventListener('input', (e) => {
    pnlCalc.state.taxSellPercent = pnlCalc.parseInputNumber(e.target.value);
    updateUI();
  });

  // Thao tác bảng DCA
  btnAddDcaRow.addEventListener('click', () => {
    pnlCalc.state.dcaRows.push({ price: '', quantity: '' });
    renderDCARows();
  });

  dcaTableBody.addEventListener('input', (e) => {
    const idx = parseInt(e.target.dataset.index, 10);
    if (e.target.classList.contains('dca-price')) {
      pnlCalc.state.dcaRows[idx].price = pnlCalc.parseInputNumber(e.target.value);
    } else if (e.target.classList.contains('dca-qty')) {
      pnlCalc.state.dcaRows[idx].quantity = pnlCalc.parseInputNumber(e.target.value);
    }
    const dca = pnlCalc.computeDCA();
    const dcaSummaryEl = document.getElementById('dca-summary-note');
    if (dcaSummaryEl) {
      dcaSummaryEl.textContent = `Giá TB: ${pnlCalc.formatMoney(dca.avgPrice)} | Tổng lượng: ${dca.totalQty.toLocaleString('vi-VN')} CP`;
    }
    updateUI();
  });

  dcaTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-dca-remove')) {
      const idx = parseInt(e.target.dataset.index, 10);
      if (pnlCalc.state.dcaRows.length > 1) {
        pnlCalc.state.dcaRows.splice(idx, 1);
        renderDCARows();
      }
    }
  });

  // Khởi động giao diện ban đầu
  inputBuyPrice.value = pnlCalc.state.buyPrice.toLocaleString('vi-VN');
  inputBuyQty.value = pnlCalc.state.buyQuantity;
  inputSellPrice.value = pnlCalc.state.sellPrice.toLocaleString('vi-VN');
  updateUI();
});
