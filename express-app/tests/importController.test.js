const fs = require('fs');
const path = require('path');

describe('importController CSV flow', () => {
  let importController;
  const mockPrisma = {
    importLog: { create: jest.fn() },
    asset: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    location: { findFirst: jest.fn(), create: jest.fn() },
    pageCounterLog: { create: jest.fn() },
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // mock ../db to return our mockPrisma
    jest.doMock('../src/db', () => mockPrisma, { virtual: false });
    importController = require('../src/controllers/importController');
  });

  test('creates new asset as needsReview when serial not found', async () => {
    const csv = 'Serial Number,Model Name,Total Page Count,Location,Node Name\nNEW123,ModelX,10,Lab,Node99';
    mockPrisma.asset.findUnique.mockResolvedValue(null);
    mockPrisma.location.findFirst.mockResolvedValue(null);
    mockPrisma.location.create.mockResolvedValue({ id: 7, name: 'Lab' });
    mockPrisma.asset.create.mockResolvedValue({ id: 11, serialNumber: 'NEW123' });

    const req = { body: csv };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    await importController.handleBrAdminCsvImport(req, res);

    expect(mockPrisma.importLog.create).toHaveBeenCalled();
    expect(mockPrisma.asset.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ serialNumber: 'NEW123', needsReview: true }) }));
    expect(mockPrisma.pageCounterLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ total: 10 }) }));
  });

  test('updates existing asset only safe fields', async () => {
    const csv = 'Serial Number,Model Name,Total Page Count,Location,Node Name\nEXIST1,ModelY,5,Office,Node01';
    mockPrisma.asset.findUnique.mockResolvedValue({ id: 20, assetTag: null, locationId: null, type: 'COMPUTER', isActive: true });
    mockPrisma.location.findFirst.mockResolvedValue({ id: 9, name: 'Office' });

    const req = { body: csv };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    await importController.handleBrAdminCsvImport(req, res);

    expect(mockPrisma.asset.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 20 }, data: expect.objectContaining({ assetTag: 'Node01', locationId: 9 }) }));
    expect(mockPrisma.pageCounterLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ assetId: 20, total: 5 }) }));
  });
});
