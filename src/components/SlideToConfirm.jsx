import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import '../styles/slidetoconfirm.css';

function SlideToConfirm({
  onConfirm,
  label = "Slide to confirm",
  confirmLabel = "Confirmed!",
  disabled = false,
  isProcessing = false,
  isCompleted = false,
  variant = "primary" // "primary" | "success" | "danger"
}) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(isCompleted);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const hasCalledOnConfirmRef = useRef(false); // Prevent double-firing onConfirm

  const THUMB_WIDTH = 56; // Width of the thumb in pixels
  const CONFIRM_THRESHOLD = 0.85; // 85% of the way to confirm

  // Keep slider at end position when processing or completed
  useEffect(() => {
    if (isProcessing || isCompleted) {
      setHasConfirmed(true);
      // Set position to end when track is available
      if (trackRef.current) {
        const trackWidth = trackRef.current.offsetWidth - THUMB_WIDTH;
        setSliderPosition(trackWidth);
      }
    } else if (!isCompleted && !isProcessing) {
      // Only reset if explicitly not completed and not processing
      // This handles the case where we want to reset the slider
    }
  }, [isProcessing, isCompleted]);

  // Reset when isCompleted prop explicitly becomes false
  useEffect(() => {
    if (isCompleted === false && !isProcessing) {
      setHasConfirmed(false);
      setSliderPosition(0);
      hasCalledOnConfirmRef.current = false; // Reset the ref too
    }
  }, [isCompleted]);

  const getTrackWidth = () => {
    if (!trackRef.current) return 0;
    return trackRef.current.offsetWidth - THUMB_WIDTH;
  };

  const handleStart = () => {
    if (disabled || isProcessing || hasConfirmed) return;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || disabled || isProcessing || hasConfirmed || hasCalledOnConfirmRef.current) return;

    const track = trackRef.current;
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const trackWidth = getTrackWidth();
    const newPosition = Math.max(0, Math.min(clientX - trackRect.left - THUMB_WIDTH / 2, trackWidth));
    const percentage = newPosition / trackWidth;

    setSliderPosition(newPosition);

    // Check if confirmed
    if (percentage >= CONFIRM_THRESHOLD) {
      // Prevent double-firing using ref (immediate, no state delay)
      if (hasCalledOnConfirmRef.current) return;
      hasCalledOnConfirmRef.current = true;

      setIsDragging(false);
      setSliderPosition(trackWidth); // Snap to end
      setHasConfirmed(true);
      onConfirm?.();
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // If not confirmed, snap back to start
    if (!hasConfirmed) {
      setSliderPosition(0);
    }
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart();
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = () => {
    handleStart();
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add/remove global event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const progressPercentage = (sliderPosition / getTrackWidth()) * 100 || 0;

  return (
    <div
      className={`stc-container ${variant} ${disabled ? 'disabled' : ''} ${isProcessing ? 'processing' : ''} ${hasConfirmed ? 'confirmed' : ''}`}
    >
      <div className="stc-track" ref={trackRef}>
        {/* Progress fill */}
        <div
          className="stc-progress"
          style={{ width: `${sliderPosition + THUMB_WIDTH}px` }}
        />

        {/* Label */}
        <div className="stc-label" style={{ opacity: hasConfirmed || isProcessing ? 0 : 1 - progressPercentage / 100 }}>
          <ChevronRight size={16} className="stc-arrow" />
          <ChevronRight size={16} className="stc-arrow" />
          <span>{label}</span>
        </div>

        {/* Confirmed label */}
        {(hasConfirmed || isProcessing) && (
          <div className="stc-confirmed-label">
            {isProcessing ? (
              <>
                <Loader2 size={18} className="stc-spinner" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>{confirmLabel}</span>
              </>
            )}
          </div>
        )}

        {/* Thumb */}
        <div
          ref={thumbRef}
          className="stc-thumb"
          style={{ left: `${sliderPosition}px` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {hasConfirmed ? (
            <Check size={24} />
          ) : isProcessing ? (
            <Loader2 size={24} className="stc-spinner" />
          ) : (
            <ChevronRight size={24} />
          )}
        </div>
      </div>
    </div>
  );
}

export default SlideToConfirm;
