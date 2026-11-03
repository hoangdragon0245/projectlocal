/**
 * App Module - Điều khiển giao diện, tương tác người dùng, gọi API & LocalStorage
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Khởi tạo State & Calculator
  let currencySettings = loadCurrencySettings();
  const calculator = new DCACalculator(currencySettings);

  // Dữ liệu hàng ban đầu (Mặc định nạp dữ liệu mẫu giống hệt trong ảnh)
  let rowsData = [
    { price: 231000, quantity: 100 },
    { price: 217000, quantity: 200 },
    { price: '', quantity: '' },
    { price: '', quantity: '' }
  ];

  // DOM Elements
  const tableBody = document.getElementById('calc-table-body');
  const addRowBtn = document.getElementById('btn-add-row');
  const resetBtn = document.getElementById('btn-reset');
  const saveBtn = document.getElementById('btn-save');
  const historyBtn = document.getElementById('btn-history');
  const presetSelect = document.getElementById('select-preset');

  // Summary Elements (Table summary row)
  const inlineAvgPrice = document.getElementById('inline-avg-price');
  const inlineTotalQty = document.getElementById('inline-total-qty');
  const inlineTotalCost = document.getElementById('inline-total-cost');

  // Big Summary Elements
  const bigAvgPrice = document.getElementById('big-avg-price');
  const bigAvgCurrency = document.getElementById('big-avg-currency');
  const bigTotalQty = document.getElementById('big-total-qty');
  const bigTotalCost = document.getElementById('big-total-cost');
  const bigTotalCurrency = document.getElementById('big-total-currency');

  // Header Currency Labels
  const headerPriceCurrency = document.getElementById('header-price-currency');
  const headerTotalCurrency = document.getElementById('header-total-currency');

  // Modals
  const settingsModal = document.getElementById('settings-modal');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const formSettings = document.getElementById('form-settings');

  const saveModal = document.getElementById('save-modal');
  const btnCloseSave = document.getElementById('btn-close-save');
  const formSavePreset = document.getElementById('form-save-preset');
  const inputPresetName = document.getElementById('preset-name');

  const historyModal = document.getElementById('history-modal');
  const btnCloseHistory = document.getElementById('btn-close-history');
  const presetListContainer = document.getElementById('preset-list');

  const toast = document.getElementById('toast-notice');

  // ----------------------------------------------------
  // 2. Render & Tính toán
  // ----------------------------------------------------
  function renderTable() {
    tableBody.innerHTML = '';

    rowsData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.dataset.index = index;

      // Giá trị hiển thị ban đầu trong input
      const displayPrice = row.price ? calculator.formatNumber(row.price) : '';
      const displayQty = row.quantity ? calculator.formatNumber(row.quantity) : '';

      tr.innerHTML = `
        <td class="col-stt">${index + 1}.</td>
        <td class="col-price">
          <input 
            type="text" 
            class="input-number input-price" 
            data-index="${index}" 
            placeholder="Giá mua" 
            value="${displayPrice}"
            autocomplete="off"
          />
        </td>
        <td class="col-symbol">x</td>
        <td class="col-qty">
          <input 
            type="text" 
            class="input-number input-qty" 
            data-index="${index}" 
            placeholder="Số lượng" 
            value="${displayQty}"
            autocomplete="off"
          />
        </td>
        <td class="col-symbol">=</td>
        <td class="col-total row-subtotal" id="subtotal-${index}"></td>
        <td class="col-actions">
          <button type="button" class="btn-remove-row" data-index="${index}" title="Xóa dòng">×</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    updateHeaderCurrencies();
    recalculateAll();
  }

  function updateHeaderCurrencies() {
    const sym = calculator.settings.symbol;
    if (headerPriceCurrency) headerPriceCurrency.textContent = `(${sym})`;
    if (headerTotalCurrency) headerTotalCurrency.textContent = `(${sym})`;
    if (bigAvgCurrency) bigAvgCurrency.textContent = sym;
    if (bigTotalCurrency) bigTotalCurrency.textContent = sym;
  }

  function recalculateAll() {
    const result = calculator.calculate(rowsData);

    // Cập nhật thành tiền từng dòng
    result.rows.forEach((row, idx) => {
      const subtotalEl = document.getElementById(`subtotal-${idx}`);
      if (subtotalEl) {
        subtotalEl.textContent = row.isValid ? calculator.formatNumber(row.subtotal) : '';
      }
    });

    // Cập nhật dòng tóm tắt trong bảng
    if (result.totalQuantity > 0) {
      inlineAvgPrice.textContent = calculator.formatNumber(result.averagePrice, calculator.settings.maxDecimals);
      inlineTotalQty.textContent = calculator.formatNumber(result.totalQuantity);
      inlineTotalCost.textContent = calculator.formatNumber(result.totalCost);

      // Cập nhật khung tóm tắt lớn phía dưới
      bigAvgPrice.textContent = calculator.formatNumber(result.averagePrice, calculator.settings.maxDecimals);
      bigTotalQty.textContent = calculator.formatNumber(result.totalQuantity);
      bigTotalCost.textContent = calculator.formatNumber(result.totalCost);
    } else {
      inlineAvgPrice.textContent = '-';
      inlineTotalQty.textContent = '-';
      inlineTotalCost.textContent = '-';

      bigAvgPrice.textContent = '0';
      bigTotalQty.textContent = '0';
      bigTotalCost.textContent = '0';
    }

    // Tự động lưu trạng thái tạm thời vào LocalStorage
    saveCurrentDraft();
  }

  // ----------------------------------------------------
  // 3. Xử lý sự kiện nhập số trong bảng
  // ----------------------------------------------------
  tableBody.addEventListener('input', (e) => {
    if (e.target.classList.contains('input-number')) {
      const index = parseInt(e.target.dataset.index, 10);
      const isPrice = e.target.classList.contains('input-price');
      const rawValue = e.target.value;

      // Cập nhật dữ liệu hàng
      const parsedNum = calculator.parseNumber(rawValue);
      if (isPrice) {
        rowsData[index].price = rawValue.trim() === '' ? '' : parsedNum;
      } else {
        rowsData[index].quantity = rawValue.trim() === '' ? '' : parsedNum;
      }

      recalculateAll();
    }
  });

  // Khi người dùng rời khỏi ô input (blur), format lại đẹp mắt
  tableBody.addEventListener('blur', (e) => {
    if (e.target.classList.contains('input-number')) {
      const isPrice = e.target.classList.contains('input-price');
      const index = parseInt(e.target.dataset.index, 10);
      const val = isPrice ? rowsData[index].price : rowsData[index].quantity;

      if (val !== '' && val !== null && !isNaN(val)) {
        e.target.value = calculator.formatNumber(val);
      } else {
        e.target.value = '';
      }
    }
  }, true);

  // Xóa dòng
  tableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-row')) {
      const index = parseInt(e.target.dataset.index, 10);
      if (rowsData.length <= 1) {
        showToast('Bảng tính phải có ít nhất 1 dòng!');
        return;
      }
      rowsData.splice(index, 1);
      renderTable();
    }
  });

  // Nút Thêm dòng (+)
  addRowBtn.addEventListener('click', () => {
    rowsData.push({ price: '', quantity: '' });
    renderTable();
    // Tự động focus vào ô giá của dòng mới thêm
    setTimeout(() => {
      const inputs = tableBody.querySelectorAll('.input-price');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    }, 50);
  });

  // Nút Reset (↻)
  resetBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn làm mới bảng tính về trạng thái ban đầu?')) {
      rowsData = [
        { price: '', quantity: '' },
        { price: '', quantity: '' },
        { price: '', quantity: '' },
        { price: '', quantity: '' }
      ];
      renderTable();
      presetSelect.value = '';
      showToast('Đã làm mới bảng tính');
    }
  });

  // ----------------------------------------------------
  // 4. Quản lý Presets (Lưu / Đọc / Danh mục)
  // ----------------------------------------------------
  saveBtn.addEventListener('click', () => {
    inputPresetName.value = `Kịch bản ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
    openModal(saveModal);
    inputPresetName.focus();
    inputPresetName.select();
  });

  const defaultDemoPresets = [
    {
      id: "demo-preset-1",
      name: "Mẫu minh họa (HPG)",
      rows: [
        { price: 231000, quantity: 100 },
        { price: 217000, quantity: 200 },
        { price: '', quantity: '' },
        { price: '', quantity: '' }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  function isStaticHost() {
    return window.location.hostname.includes('github.io') || window.location.protocol === 'file:';
  }

  formSavePreset.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = inputPresetName.value.trim();
    if (!name) return;

    const payload = {
      name,
      rows: rowsData,
      currencySettings: calculator.settings
    };

    if (isStaticHost()) {
      savePresetToLocalStorage(payload);
      closeModal(saveModal);
      showToast(`Đã lưu "${name}" thành công!`);
      await loadPresetDropdown();
      presetSelect.value = payload.id;
      return;
    }

    try {
      // Gửi lên backend API
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Server error: ' + res.status);
      const data = await res.json();

      if (data.success) {
        closeModal(saveModal);
        showToast(`Đã lưu "${name}" thành công!`);
        await loadPresetDropdown();
        presetSelect.value = data.data.id;
      } else {
        alert(data.message || 'Lỗi khi lưu');
      }
    } catch (err) {
      console.warn('Backend API không phản hồi, lưu vào LocalStorage:', err);
      // Fallback lưu LocalStorage
      savePresetToLocalStorage(payload);
      closeModal(saveModal);
      showToast(`Đã lưu "${name}" vào bộ nhớ máy!`);
      await loadPresetDropdown();
      presetSelect.value = payload.id;
    }
  });

  // Dropdown chọn preset
  presetSelect.addEventListener('change', async (e) => {
    const presetId = e.target.value;
    if (!presetId) return;
    await applyPresetById(presetId);
  });

  // Nút Menu Lịch sử (☰)
  historyBtn.addEventListener('click', async () => {
    await renderHistoryModal();
    openModal(historyModal);
  });

  async function getAllPresets() {
    if (isStaticHost()) {
      return getLocalStoragePresets();
    }
    try {
      const res = await fetch('/api/presets');
      if (!res.ok) throw new Error('API error: ' + res.status);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) return json.data;
      return getLocalStoragePresets();
    } catch (err) {
      return getLocalStoragePresets();
    }
  }

  async function loadPresetDropdown() {
    presetSelect.innerHTML = '<option value="">-- Chọn kịch bản --</option>';
    const presets = await getAllPresets();

    presets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      presetSelect.appendChild(opt);
    });
  }

  async function applyPresetById(id) {
    const presets = await getAllPresets();
    const found = presets.find(p => p.id === id);
    if (found && Array.isArray(found.rows)) {
      rowsData = JSON.parse(JSON.stringify(found.rows));
      if (found.currencySettings) {
        calculator.updateSettings(found.currencySettings);
        saveCurrencySettings(calculator.settings);
      }
      renderTable();
      showToast(`Đã tải kịch bản: ${found.name}`);
    }
  }

  async function renderHistoryModal() {
    presetListContainer.innerHTML = '';
    const presets = await getAllPresets();

    if (presets.length === 0) {
      presetListContainer.innerHTML = '<p style="color:#6b7280; text-align:center; padding:16px;">Chưa có kịch bản nào được lưu.</p>';
      return;
    }

    presets.forEach(p => {
      const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : '';
      const item = document.createElement('div');
      item.className = 'preset-item';
      item.innerHTML = `
        <div class="preset-item-info">
          <span class="preset-item-name">${escapeHtml(p.name)}</span>
          <span class="preset-item-date">${dateStr}</span>
        </div>
        <div class="preset-item-actions">
          <button class="btn-preset-load" data-id="${p.id}">Tải</button>
          <button class="btn-preset-del" data-id="${p.id}">Xóa</button>
        </div>
      `;
      presetListContainer.appendChild(item);
    });

    // Gắn sự kiện nút Tải / Xóa
    presetListContainer.querySelectorAll('.btn-preset-load').forEach(btn => {
      btn.addEventListener('click', async () => {
        await applyPresetById(btn.dataset.id);
        presetSelect.value = btn.dataset.id;
        closeModal(historyModal);
      });
    });

    presetListContainer.querySelectorAll('.btn-preset-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Bạn có chắc muốn xóa kịch bản này?')) {
          await deletePresetById(btn.dataset.id);
          await renderHistoryModal();
          await loadPresetDropdown();
          showToast('Đã xóa kịch bản');
        }
      });
    });
  }

  async function deletePresetById(id) {
    if (!isStaticHost()) {
      try {
        const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('API delete failed');
        return;
      } catch (err) {
        // Fallback local
      }
    }
    let local = getLocalStoragePresets();
    local = local.filter(p => p.id !== id);
    localStorage.setItem('dca_presets', JSON.stringify(local));
  }

  // ----------------------------------------------------
  // 5. Cài đặt tiền tệ (Currency Settings)
  // ----------------------------------------------------
  btnOpenSettings.addEventListener('click', () => {
    document.getElementById('setting-symbol').value = calculator.settings.symbol;
    document.getElementById('setting-thousand-sep').value = calculator.settings.thousandSep;
    document.getElementById('setting-decimal-sep').value = calculator.settings.decimalSep;
    document.getElementById('setting-decimals').value = calculator.settings.maxDecimals;
    openModal(settingsModal);
  });

  formSettings.addEventListener('submit', (e) => {
    e.preventDefault();
    const symbol = document.getElementById('setting-symbol').value.trim() || 'đ';
    const thousandSep = document.getElementById('setting-thousand-sep').value;
    const decimalSep = document.getElementById('setting-decimal-sep').value;
    const maxDecimals = parseInt(document.getElementById('setting-decimals').value, 10);

    if (thousandSep === decimalSep) {
      alert('Dấu phân cách hàng nghìn và dấu thập phân không được trùng nhau!');
      return;
    }

    const newSettings = { symbol, thousandSep, decimalSep, maxDecimals };
    calculator.updateSettings(newSettings);
    saveCurrencySettings(newSettings);

    renderTable();
    closeModal(settingsModal);
    showToast('Đã cập nhật cài đặt tiền tệ');
  });

  // Modal Closers
  btnCloseSettings.addEventListener('click', () => closeModal(settingsModal));
  btnCloseSave.addEventListener('click', () => closeModal(saveModal));
  btnCloseHistory.addEventListener('click', () => closeModal(historyModal));

  [settingsModal, saveModal, historyModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ----------------------------------------------------
  // 6. Helpers & LocalStorage Utilities
  // ----------------------------------------------------
  function openModal(modal) {
    modal.classList.add('active');
  }

  function closeModal(modal) {
    modal.classList.remove('active');
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function loadCurrencySettings() {
    try {
      const saved = localStorage.getItem('dca_currency_settings');
      return saved ? JSON.parse(saved) : defaultCurrencySettings;
    } catch (e) {
      return defaultCurrencySettings;
    }
  }

  function saveCurrencySettings(settings) {
    try {
      localStorage.setItem('dca_currency_settings', JSON.stringify(settings));
    } catch (e) {}
  }

  function saveCurrentDraft() {
    try {
      localStorage.setItem('dca_current_draft', JSON.stringify(rowsData));
    } catch (e) {}
  }

  function getLocalStoragePresets() {
    try {
      const s = localStorage.getItem('dca_presets');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Khởi tạo sẵn preset mẫu nếu chưa có
      localStorage.setItem('dca_presets', JSON.stringify(defaultDemoPresets));
      return defaultDemoPresets;
    } catch (e) {
      return defaultDemoPresets;
    }
  }

  function savePresetToLocalStorage(preset) {
    const list = getLocalStoragePresets();
    preset.id = 'local_' + Date.now();
    preset.createdAt = new Date().toISOString();
    list.unshift(preset);
    localStorage.setItem('dca_presets', JSON.stringify(list));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Khởi động
  renderTable();
  loadPresetDropdown();
});
