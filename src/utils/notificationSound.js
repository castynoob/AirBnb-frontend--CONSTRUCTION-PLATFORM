// Simple notification sound using Web Audio API
export const playNotificationSound = () => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create oscillator for sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound (pleasant notification beep)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz

    // Volume envelope (fade in and out)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Clean up
    setTimeout(() => {
      oscillator.disconnect();
      gainNode.disconnect();
      audioContext.close();
    }, 400);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

// Alternative: If you have a sound file
export const playNotificationSoundFromFile = (soundUrl = '/notification.mp3') => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.5; // 50% volume
    audio.play().catch(err => {
      console.log('Could not play notification sound:', err);
    });
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};
