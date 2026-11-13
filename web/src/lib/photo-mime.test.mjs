import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffPhotoMime } from './photo-mime.ts';

const webp = () => {
  const bytes = new Uint8Array(16);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  return bytes;
};
const heic = () => {
  const bytes = new Uint8Array(16);
  bytes.set([0x66, 0x74, 0x79, 0x70], 4);
  bytes.set([0x68, 0x65, 0x69, 0x63], 8);
  return bytes;
};

test('recognises jpeg, png and webp by their magic bytes', () => {
  assert.equal(sniffPhotoMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(sniffPhotoMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  assert.equal(sniffPhotoMime(webp()), 'image/webp');
});

test('rejects gif, svg, html, tiff and heic regardless of any declared type', () => {
  assert.equal(sniffPhotoMime(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])), null);
  assert.equal(sniffPhotoMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">')), null);
  assert.equal(sniffPhotoMime(new TextEncoder().encode('<!DOCTYPE html><html>')), null);
  assert.equal(sniffPhotoMime(new Uint8Array([0x49, 0x49, 0x2a, 0x00])), null);
  assert.equal(sniffPhotoMime(new Uint8Array([0x4d, 0x4d, 0x00, 0x2a])), null);
  assert.equal(sniffPhotoMime(heic()), null);
});

test('rejects empty or truncated headers without throwing', () => {
  assert.equal(sniffPhotoMime(new Uint8Array([])), null);
  assert.equal(sniffPhotoMime(new Uint8Array([0xff, 0xd8])), null);
  assert.equal(sniffPhotoMime(new Uint8Array([0x89, 0x50])), null);
  assert.equal(sniffPhotoMime(new Uint8Array([0x52, 0x49, 0x46, 0x46])), null);
});
