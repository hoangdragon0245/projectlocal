const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'presets.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and file exist
function initDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = [
      {
        id: "demo-preset-1",
        name: "Mẫu minh họa (HPG)",
        rows: [
          { price: 231000, quantity: 100 },
          { price: 217000, quantity: 200 },
          { price: null, quantity: null },
          { price: null, quantity: null }
        ],
        currency: "VND",
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

function readPresets() {
  try {
    initDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading presets:', err);
    return [];
  }
}

function writePresets(presets) {
  try {
    initDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(presets, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing presets:', err);
    return false;
  }
}

// REST API Endpoints
app.get('/api/presets', (req, res) => {
  const presets = readPresets();
  res.json({ success: true, data: presets });
});

app.post('/api/presets', (req, res) => {
  const { name, rows, currencySettings } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống' });
  }

  const presets = readPresets();
  const newPreset = {
    id: 'preset_' + Date.now(),
    name: name.trim(),
    rows: Array.isArray(rows) ? rows : [],
    currencySettings: currencySettings || null,
    createdAt: new Date().toISOString()
  };

  presets.unshift(newPreset); // Newest first
  writePresets(presets);

  res.status(201).json({ success: true, data: newPreset });
});

app.delete('/api/presets/:id', (req, res) => {
  const { id } = req.params;
  let presets = readPresets();
  const initialLength = presets.length;
  presets = presets.filter(p => p.id !== id);

  if (presets.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy kịch bản' });
  }

  writePresets(presets);
  res.json({ success: true, message: 'Đã xóa kịch bản thành công' });
});

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Ứng dụng Máy tính giá bình quân đang chạy tại:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`===============================================`);
});
