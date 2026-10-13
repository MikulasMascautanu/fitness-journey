import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// Dependency-free PNG generation keeps the install icons reproducible.
const crc32 = buffer => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const chunk = (name, data) => {
  const kind = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([kind, data])));
  return Buffer.concat([length, kind, data, crc]);
};
const inside = (x, y, left, top, width, height, radius) => {
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius));
  const dy = Math.max(top + radius - y, 0, y - (top + height - radius));
  return x >= left && x <= left + width && y >= top && y <= top + height && dx * dx + dy * dy <= radius * radius;
};
for (const size of [180, 192, 512]) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const colors = [0, 0, 0];
    for (const sx of [.25, .75]) for (const sy of [.25, .75]) {
      const px = (x + sx) / size, py = (y + sy) / size;
      let color = [66, 115, 84];
      if (inside(px, py, .29, .26, .12, .48, .025) || inside(px, py, .29, .26, .38, .1, .025) || inside(px, py, .29, .46, .29, .1, .025)) color = [246, 247, 244];
      if ((px - .66) ** 2 + (py - .685) ** 2 < .045 ** 2) color = [181, 203, 144];
      color.forEach((channel, index) => { colors[index] += channel / 4; });
    }
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    colors.forEach((value, i) => { raw[offset + i] = Math.round(value); }); raw[offset + 3] = 255;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
