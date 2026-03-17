import React, { useState } from 'react';
import StarRating from './StarRating';
import { reviewService } from '../../services/reviewService';
import './ReviewForm.css';

const ReviewForm = ({ productId, onReviewSubmitted, onCancel }) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const [formData, setFormData] = useState({
        rating: 0,
        title: '',
        comment: '',
        userName: user?.name || '',
        userEmail: user?.email || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingChange = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.rating === 0) { setError('Please select a rating'); return; }
        if (formData.comment.trim().length < 10) { setError('Review must be at least 10 characters long'); return; }
        if (!formData.userName.trim()) { setError('Please enter your name'); return; }

        try {
            setIsSubmitting(true);
            setError('');
            await reviewService.submitReview({
                ...formData,
                productId,
                userId: user?.id || `guest_${Date.now()}`,
            });
            setFormData({ rating: 0, title: '', comment: '', userName: user?.name || '', userEmail: user?.email || '' });
            if (onReviewSubmitted) onReviewSubmitted();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="review-form-container">
            <div className="review-form-header">
                <h3>Write a Review</h3>
                <p>Share your experience with this product</p>
            </div>

            <form onSubmit={handleSubmit} className="review-form">
                {/* Star Rating */}
                <div className="form-group">
                    <label>Your Rating *</label>
                    <div className="rating-input">
                        <StarRating
                            rating={formData.rating}
                            interactive={true}
                            onRatingChange={handleRatingChange}
                            size="large"
                        />
                        <span className="rating-label">
                            {formData.rating === 0 && 'Select a rating'}
                            {formData.rating === 1 && 'Poor'}
                            {formData.rating === 2 && 'Fair'}
                            {formData.rating === 3 && 'Good'}
                            {formData.rating === 4 && 'Very Good'}
                            {formData.rating === 5 && 'Excellent!'}
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div className="form-group">
                    <label htmlFor="rf-title">Review Title (Optional)</label>
                    <input
                        type="text"
                        id="rf-title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Summarize your experience"
                        maxLength={100}
                    />
                </div>

                {/* Comment */}
                <div className="form-group">
                    <label htmlFor="rf-comment">Your Review *</label>
                    <textarea
                        id="rf-comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleInputChange}
                        placeholder="Tell others what you think — what you liked or disliked, and how you used it."
                        rows={5}
                        maxLength={1000}
                        required
                    />
                    <div className="character-count">{formData.comment.length}/1000</div>
                </div>

                {/* Name */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="rf-name">Your Name *</label>
                        <input
                            type="text"
                            id="rf-name"
                            name="userName"
                            value={formData.userName}
                            onChange={handleInputChange}
                            placeholder="Enter your name"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="rf-email">Email (Optional)</label>
                        <input
                            type="email"
                            id="rf-email"
                            name="userEmail"
                            value={formData.userEmail}
                            onChange={handleInputChange}
                            placeholder="Not shown publicly"
                        />
                    </div>
                </div>

                {error && <div className="rf-error">{error}</div>}

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-cancel" disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;
