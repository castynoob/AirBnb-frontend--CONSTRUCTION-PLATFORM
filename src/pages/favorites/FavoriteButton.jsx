import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { addFavorite, removeFavorite, checkFavorite } from '../../utils/api';
import '../../styles/manager/favoritebutton.css';

/**
 * FavoriteButton Component
 * Allows property managers to favorite/unfavorite entrepreneurs
 * 
 * @param {string} entrepreneurId - ID of the entrepreneur
 * @param {string} jobId - Optional job ID
 * @param {string} bidId - Optional bid ID
 * @param {string} size - Button size: 'small', 'medium', 'large'
 * @param {function} onFavoriteChange - Callback when favorite status changes
 */
const FavoriteButton = ({
  entrepreneurId,
  jobId = null,
  bidId = null,
  size = 'medium',
  onFavoriteChange = null
}) => {
  console.log('FavoriteButton props:', {
    entrepreneurId,
    jobId,
    bidId,
    entrepreneurIdType: typeof entrepreneurId
  });

  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if this specific bid is already favorited
  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (!bidId) {
          console.warn('No bidId provided, cannot check favorite status');
          return;
        }
        const response = await checkFavorite(bidId);
        setIsFavorited(response.isFavorited);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };

    if (bidId) {
      checkStatus();
    }
  }, [bidId]);

  // Toggle favorite status
  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    setError(null);

    try {
      if (!bidId) {
        throw new Error('Bid ID is required');
      }

      if (isFavorited) {
        // Remove from favorites by bidId
        console.log('Removing favorite for bid:', bidId);
        const response = await removeFavorite(bidId);
        console.log('Remove favorite response:', response);
        setIsFavorited(false);

        if (onFavoriteChange) {
          onFavoriteChange(bidId, false);
        }
      } else {
        // Add to favorites
        console.log('Adding favorite:', { entrepreneurId, jobId, bidId });
        const response = await addFavorite(entrepreneurId, jobId, bidId);
        console.log('Add favorite response:', response);
        setIsFavorited(true);

        if (onFavoriteChange) {
          onFavoriteChange(bidId, true);
        }

        // Navigate to favorites page after adding to favorites
        setTimeout(() => {
          navigate('/favorites/property_manager');
        }, 500); // Small delay to show the heart animation
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      console.error('Error details:', {
        message: err.message,
        entrepreneurId,
        jobId,
        bidId,
        isFavorited
      });
      setError(err.message || 'Failed to update favorite');

      // Revert UI state on error
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fav-favorite-button-container">
      <button
        className={`fav-favorite-button fav-${size} ${isFavorited ? 'fav-favorited' : ''} ${isLoading ? 'fav-loading' : ''}`}
        onClick={handleToggleFavorite}
        disabled={isLoading}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isLoading ? (
          <span className="fav-spinner"></span>
        ) : isFavorited ? (
          <FaHeart className="fav-heart-icon fav-filled" />
        ) : (
          <FaRegHeart className="fav-heart-icon" />
        )}
      </button>

      {error && (
        <div className="fav-favorite-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;