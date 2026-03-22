import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { reviewService } from '../../services/reviewService';
import './ReviewDisplay.css';

const ReviewDisplay = ({ productId }) => {
    const [reviewData, setReviewData] = useState({
        reviews: [],
        totalReviews: 0,
        averageRating: 0,
        ratingCounts: {}
    });
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [filterRating, setFilterRating] = useState(0);
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => { fetchReviews(); }, [productId]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const data = await reviewService.getProductReviews(productId);
            setReviewData(data);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmitted = () => {
        setShowReviewForm(false);
        fetchReviews();
    };

    const handleMarkHelpful = async (reviewId) => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user?.id) { alert('Please log in to mark reviews as helpful'); return; }
        try {
            await reviewService.markHelpful(reviewId, user.id);
            fetchReviews();
        } catch (err) {
            alert(err.message || 'Failed to mark review as helpful');
        }
    };

    const getFilteredAndSortedReviews = () => {
        let list = filterRating > 0
            ? reviewData.reviews.filter(r => r.rating === filterRating)
            : [...reviewData.reviews];

        list.sort((a, b) => {
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'rating-high') return b.rating - a.rating;
            if (sortBy === 'rating-low') return a.rating - b.rating;
            return new Date(b.createdAt) - new Date(a.createdAt); // newest
        });
        return list;
    };

    const getRatingPercentage = (rating) => {
        const count = reviewData.ratingCounts[rating] || 0;
        return reviewData.totalReviews > 0 ? (count / reviewData.totalReviews) * 100 : 0;
    };

    if (loading) return (
        <div className="reviews-section">
            <div className="reviews-loading">Loading reviews…</div>
        </div>
    );

    const filteredReviews = getFilteredAndSortedReviews();

    return (
        <div className="reviews-section">

            {/* ── Summary ── */}
            <div className="reviews-summary">
                <div className="summary-header">
                    <h3>Customer Reviews</h3>
                    <button
                        className="write-review-btn"
                        onClick={() => setShowReviewForm(v => !v)}
                    >
                        {showReviewForm ? 'Cancel' : 'Write a Review'}
                    </button>
                </div>

                <div className="rating-overview">
                    <div className="overall-rating">
                        <StarRating rating={reviewData.averageRating} size="large" />
                        <div className="rating-details">
                            <span className="rating-number">{reviewData.averageRating.toFixed(1)}</span>
                            <span className="total-reviews">Based on {reviewData.totalReviews} review{reviewData.totalReviews !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <div className="rating-breakdown">
                        {[5, 4, 3, 2, 1].map(rating => (
                            <div key={rating} className="rating-bar-item">
                                <span className="rating-label">{rating} ★</span>
                                <div className="rating-bar">
                                    <div className="rating-fill" style={{ width: `${getRatingPercentage(rating)}%` }} />
                                </div>
                                <span className="rating-count">{reviewData.ratingCounts[rating] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Review Form ── */}
            {showReviewForm && (
                <ReviewForm
                    productId={productId}
                    onReviewSubmitted={handleReviewSubmitted}
                    onCancel={() => setShowReviewForm(false)}
                />
            )}

            {/* ── Filters ── */}
            {reviewData.totalReviews > 0 && (
                <div className="reviews-controls">
                    <div className="filter-sort-group">
                        <label>Filter:</label>
                        <select value={filterRating} onChange={e => setFilterRating(Number(e.target.value))}>
                            <option value={0}>All ratings</option>
                            <option value={5}>5 stars</option>
                            <option value={4}>4 stars</option>
                            <option value={3}>3 stars</option>
                            <option value={2}>2 stars</option>
                            <option value={1}>1 star</option>
                        </select>
                    </div>
                    <div className="filter-sort-group">
                        <label>Sort:</label>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="rating-high">Highest rating</option>
                            <option value="rating-low">Lowest rating</option>
                        </select>
                    </div>
                </div>
            )}

            {/* ── Review List ── */}
            <div className="reviews-list">
                {filteredReviews.length === 0 ? (
                    <div className="no-reviews">
                        <p>No reviews yet. Be the first to review this product!</p>
                        {!showReviewForm && (
                            <button className="write-review-btn" onClick={() => setShowReviewForm(true)}>
                                Write a Review
                            </button>
                        )}
                    </div>
                ) : (
                    filteredReviews.map(review => {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const hasLiked = review.helpfulUserIds?.includes(user.id);
                        return (
                            <div key={review.id} className="review-item">
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <div className="reviewer-avatar">
                                            {(review.userName || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="reviewer-details">
                                            <span className="reviewer-name">{review.userName}</span>
                                            {review.verified && (
                                                <span className="verified-badge">✓ Verified Purchase</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="review-date">
                                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className="review-rating">
                                    <StarRating rating={review.rating} size="small" />
                                </div>

                                {review.title && <div className="review-title">{review.title}</div>}
                                <div className="review-comment">{review.comment}</div>

                                <div className="review-actions">
                                    <button
                                        className={`helpful-btn ${hasLiked ? 'already-helpful' : ''}`}
                                        onClick={() => handleMarkHelpful(review.id)}
                                        disabled={hasLiked}
                                    >
                                        👍 {hasLiked ? 'Marked helpful' : 'Helpful'} ({review.helpfulCount || 0})
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ReviewDisplay;
