import providedReviewRows from '../data/provided-reviews.json';
import additionalReviewRows from '../data/additional-reviews.json';

const normaliseName = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const providedByName = new Map([...new Set([...Object.keys(providedReviewRows), ...Object.keys(additionalReviewRows)])]
  .map(name => [normaliseName(name), [...(providedReviewRows[name] || []), ...(additionalReviewRows[name] || [])]]));

export function providedReviewsForProduct(product) {
  const name = normaliseName(typeof product === 'string' ? product : product?.name);
  return (providedByName.get(name) || []).map(([reviewer, rating, comment], index) => ({
    _id: `provided-${name.replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
    name: reviewer,
    rating,
    comment,
    source: 'store-provided',
    verifiedPurchase: false,
    images: []
  }));
}
if (typeof window !== 'undefined') window.eeProvidedReviewsForProduct = providedReviewsForProduct;

export function withProvidedReviews(reviews, product) {
  const live = validReviews(reviews);
  const existing = new Set(live.map(review => String(review._id)));
  return [...live, ...providedReviewsForProduct(product).filter(review => !existing.has(review._id))];
}

export function providedSummaryForProduct(product) {
  const reviews = providedReviewsForProduct(product);
  return reviews.length ? {
    count: reviews.length,
    average: Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length * 10) / 10
  } : null;
}

export function validReviews(reviews) {
  return (Array.isArray(reviews) ? reviews : []).filter(review =>
    review && Number.isInteger(Number(review.rating)) && Number(review.rating) >= 1 && Number(review.rating) <= 5);
}
export function reviewText(review) {
  return String(review?.comment || review?.review || review?.text || '').trim();
}
export function summarizeReviews(reviews) {
  const rated = validReviews(reviews);
  const written = rated.filter(review => reviewText(review));
  return {
    ratingCount: rated.length,
    reviewCount: written.length,
    average: rated.length ? rated.reduce((sum, review) => sum + Number(review.rating), 0) / rated.length : 0,
    excerpt: written.length ? reviewText(written[0]) : ''
  };
}
