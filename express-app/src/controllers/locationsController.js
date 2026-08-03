const prisma = require('../db');
const path = require('path');
const fs   = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/maps');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

exports.listLocations = async (req, res) => {
  try {
    const items = await prisma.location.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json({ items });
  } catch (err) {
    console.error('listLocations', err);
    return res.status(500).json({ error: 'Failed to list locations' });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
    const loc = await prisma.location.create({ data: { name: name.trim() } });
    return res.status(201).json(loc);
  } catch (err) {
    console.error('createLocation', err);
    return res.status(500).json({ error: 'Failed to create location' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
    const loc = await prisma.location.update({
      where: { id },
      data: { name: name.trim() },
    });
    return res.json(loc);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Location not found' });
    console.error('updateLocation', err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const count = await prisma.asset.count({ where: { locationId: id } });
    if (count > 0) {
      return res.status(409).json({ error: `Cannot delete: ${count} asset(s) assigned to this location` });
    }
    await prisma.location.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Location not found' });
    console.error('deleteLocation', err);
    return res.status(500).json({ error: 'Failed to delete location' });
  }
};

/**
 * POST /locations/:id/map-image
 * Body: { imageData: "data:image/png;base64,..." }
 * Saves the image to disk and stores the URL in the database.
 */
exports.uploadMapImage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { imageData } = req.body;

    if (!imageData || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'imageData must be a base64 data URL (data:image/...)' });
    }

    // Validate size — reject if > 5 MB (base64 ~1.33× raw)
    const base64Size = imageData.length * 0.75;
    if (base64Size > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max 5 MB)' });
    }

    // Determine extension from MIME type
    const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    if (!mimeMatch) return res.status(400).json({ error: 'Invalid image format' });
    const mimeType = mimeMatch[1];
    const ext = mimeType === 'image/jpeg' ? 'jpg'
              : mimeType === 'image/png'  ? 'png'
              : mimeType === 'image/webp' ? 'webp'
              : null;
    if (!ext) return res.status(400).json({ error: 'Unsupported image type (use jpg, png, or webp)' });

    ensureUploadDir();

    // Remove old image for this location if exists
    const existing = await prisma.location.findUnique({ where: { id }, select: { mapImageUrl: true } });
    if (existing?.mapImageUrl) {
      const oldFile = path.join(__dirname, '../..', existing.mapImageUrl.replace(/^\//, ''));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    // Save new file
    const filename  = `location_${id}_${Date.now()}.${ext}`;
    const filepath  = path.join(UPLOAD_DIR, filename);
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

    const mapImageUrl = `/uploads/maps/${filename}`;
    const loc = await prisma.location.update({
      where: { id },
      data: { mapImageUrl },
    });

    return res.json({ ok: true, mapImageUrl, location: loc });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Location not found' });
    console.error('uploadMapImage', err);
    return res.status(500).json({ error: 'Failed to upload map image' });
  }
};

/**
 * DELETE /locations/:id/map-image
 * Removes the map image from disk and clears the DB field.
 */
exports.deleteMapImage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const loc = await prisma.location.findUnique({ where: { id }, select: { mapImageUrl: true } });
    if (!loc) return res.status(404).json({ error: 'Location not found' });

    if (loc.mapImageUrl) {
      const file = path.join(__dirname, '../..', loc.mapImageUrl.replace(/^\//, ''));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }

    const updated = await prisma.location.update({
      where: { id },
      data: { mapImageUrl: null },
    });
    return res.json({ ok: true, location: updated });
  } catch (err) {
    console.error('deleteMapImage', err);
    return res.status(500).json({ error: 'Failed to delete map image' });
  }
};
