const parser = require('../src/services/bradminCsvParser');

test('sanitizes BOM, formula injection and parses pages', () => {
  const csv = `Serial Number,Model Name,Total Page Count,Location,Node Name\n\uFEFFABC123,"=SUM(1,2)",1,Office A,Node01\nDEF456,+1+2,2,Office B,Node02`;
  const { devices } = parser.parse(csv);
  expect(devices.length).toBe(2);
  // BOM removed
  expect(devices[0].serial).toBe('ABC123');
  // formula injection prefixed with '\''
  expect(devices[0].model).toBe("'=SUM(1,2)");
  // pages parsed as number
  expect(devices[0].pages).toBe(1);
  // second row formula prefix
  expect(devices[1].model).toBe("'+1+2");
  expect(devices[1].serial).toBe('DEF456');
});
