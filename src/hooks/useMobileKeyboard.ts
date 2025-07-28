import { useEffect, useState } from 'react';

interface MobileKeyboardState {
  isVisible: boolean;
  height: number;
}

/**
 * Hook to detect mobile keyboard visibility and adjust UI accordingly
 * Useful for handling viewport changes when virtual keyboard appears
 */
export function useMobileKeyboard(): MobileKeyboardState {
  const [keyboardState, setKeyboardState] = useState<MobileKeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      const newHeight = window.visualViewport.height;
      const heightDifference = initialViewportHeight - newHeight;
      
      // Consider keyboard visible if viewport shrunk by more than 150px
      const isKeyboardVisible = heightDifference > 150;
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: isKeyboardVisible ? heightDifference : 0,
      });

      // Update for future reference if needed
    };

    // Fallback for older browsers without visualViewport
    const handleResize = () => {
      if (window.visualViewport) return; // Use visualViewport if available

      const newHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - newHeight;
      const isKeyboardVisible = heightDifference > 150;
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: isKeyboardVisible ? heightDifference : 0,
      });
    };

    // Use visualViewport API if available (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return keyboardState;
}