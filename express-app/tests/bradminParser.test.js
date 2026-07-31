const fs = require('fs');
const path = require('path');
const parser = require('../src/services/bradminParser');

test('parses simple bradmin sample without throwing', async () => {
  const samplePath = path.join(__dirname, 'samples', 'bradmin-sample.xml');
  if (!fs.existsSync(samplePath)) return; // skip if sample not present
  const xml = fs.readFileSync(samplePath, 'utf8');
  const result = await parser.parse(xml);
  expect(result).toBeDefined();
  expect(Array.isArray(result.devices)).toBe(true);
});
