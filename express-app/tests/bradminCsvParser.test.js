const fs = require('fs');
const path = require('path');
const parser = require('../src/services/bradminCsvParser');

test('parses sample csv and finds serials', () => {
  const samplePath = path.join('C:', 'Users', 'ACER', 'Downloads', 'DevicesList 27-7-2569.csv');
  if (!fs.existsSync(samplePath)) return;
  const sample = fs.readFileSync(samplePath, 'utf8');
  const { devices } = parser.parse(sample);
  expect(Array.isArray(devices)).toBe(true);
  // expect at least one device with a serial
  expect(devices.some(d => d.serial)).toBe(true);
});
