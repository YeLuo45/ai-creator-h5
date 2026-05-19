/**
 * generate-icons.js - Generate PWA icons using pure JavaScript
 * Creates minimal valid PNG files with blue gradient and emoji
 */

const fs = require('fs');
const path = require('path');

// Minimal PNG generation (no external dependencies)
function createPNG(width, height) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // Image data - blue gradient with emoji placeholder
  const rawData = [];

  // Simple emoji approximation: create a simpler icon with just gradient
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Blue gradient
      const t = (x + y) / (width + height);
      const r = Math.round(26 + (13 - 26) * t);  // #1A73E8 to #0D47A1
      const g = Math.round(115 + (71 - 115) * t);
      const b = Math.round(232 + (161 - 232) * t);

      // Center circle area (emoji placeholder)
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = width * 0.35;

      if (dist < maxDist) {
        // White center (emoji area)
        rawData.push(255, 255, 255, 255);
      } else {
        // Blue gradient background
        rawData.push(r, g, b, 255);
      }
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation for PNG
function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  const table = [];

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }

  return crc ^ 0xFFFFFFFF;
}

// Generate icons
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, 192));
console.log('Generated: icons/icon-192.png');

fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, 512));
console.log('Generated: icons/icon-512.png');
