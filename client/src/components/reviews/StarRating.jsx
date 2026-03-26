import React from 'react';
import './StarRating.css';

const StarRating = ({
    rating = 0,
    maxRating = 5,
    size = 'medium',
    interactive = false,
    onRatingChange = null
}) => {
    const handleStarClick = (starValue) => {
        if (interactive && onRatingChange) {
            onRatingChange(starValue);
        }
    };

    return (
        <div className={`star-rating ${size} ${interactive ? 'interactive' : ''}`}>
            {[...Array(maxRating)].map((_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= rating;
                const isHalfFilled = rating > index && rating < starValue;

                return (
                    <span
                        key={index}
                        className={`star ${isFilled ? 'filled' : ''} ${isHalfFilled ? 'half-filled' : ''}`}
                        onClick={() => handleStarClick(starValue)}
                        style={{ cursor: interactive ? 'pointer' : 'default' }}
                    >
                        ★
                    </span>
                );
            })}
            {rating > 0 && !interactive && (
                <span className="rating-text">{rating.toFixed(1)}</span>
            )}
        </div>
    );
};

export default StarRating;
