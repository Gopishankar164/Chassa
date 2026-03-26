import API_BASE_URL from '../config/api';

const REVIEWS_API_URL = `${API_BASE_URL}/api/reviews`;

export const reviewService = {
    // Get all reviews for a product
    getProductReviews: async (productId) => {
        try {
            const response = await fetch(`${REVIEWS_API_URL}/product/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            return await response.json();
        } catch (error) {
            // Return empty data on error so UI still renders
            return { reviews: [], totalReviews: 0, averageRating: 0, ratingCounts: {} };
        }
    },

    // Submit a new review
    submitReview: async (reviewData) => {
        const response = await fetch(REVIEWS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit review');
        }
        return await response.json();
    },

    // Mark review as helpful
    markHelpful: async (reviewId, userId) => {
        const response = await fetch(`${REVIEWS_API_URL}/${reviewId}/helpful?userId=${userId}`, {
            method: 'PATCH',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to mark review as helpful');
        }
        return await response.json();
    },
};
