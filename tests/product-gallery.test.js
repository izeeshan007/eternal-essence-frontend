import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleGalleryIndices } from '../src/productGallery.js';

test('hidden perfume sizes remove only their gallery slots', () => {
 const product = { category: 'Perfume', images: Array.from({length: 10}, (_, index) => `image-${index}.webp`) };
 const sizes = [
  { value: 8, unit: 'ml', isStorefrontVisible: false },
  { value: 20, unit: 'ml', isStorefrontVisible: false },
  { value: 30, unit: 'ml', isStorefrontVisible: true },
  { value: 30, unit: 'ml Gift', isStorefrontVisible: true }
 ];
 assert.deepEqual(visibleGalleryIndices(product, sizes), [0, 3, 6, 9]);
});

test('attar and unavailable size metadata do not hide unrelated photos', () => {
 const product = { category: 'Attar', images: ['a.webp', 'b.webp', 'c.webp'] };
 assert.deepEqual(visibleGalleryIndices(product, [{ value: 8, unit: 'ml', isStorefrontVisible: false }]), [0, 1, 2]);
 assert.deepEqual(visibleGalleryIndices({ ...product, category: 'Perfume' }, []), [0, 1, 2]);
});
