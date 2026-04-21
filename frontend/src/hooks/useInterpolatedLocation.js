import { useEffect, useState, useRef } from "react";

export function useInterpolatedLocation(targetLat, targetLng, duration = 2000) {
  const [pos, setPos] = useState([targetLat, targetLng]);
  const currentPos = useRef([targetLat, targetLng]);
  const startTime = useRef(null);
  const startPos = useRef([targetLat, targetLng]);
  const targetPos = useRef([targetLat, targetLng]);
  const animationFrame = useRef(null);

  useEffect(() => {
    // If target changed, start new interpolation
    if (targetLat !== targetPos.current[0] || targetLng !== targetPos.current[1]) {
      startPos.current = [...currentPos.current];
      targetPos.current = [targetLat, targetLng];
      startTime.current = performance.now();
      
      const animate = (now) => {
        const elapsed = now - startTime.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Linear interpolation
        const lat = startPos.current[0] + (targetPos.current[0] - startPos.current[0]) * progress;
        const lng = startPos.current[1] + (targetPos.current[1] - startPos.current[1]) * progress;
        
        currentPos.current = [lat, lng];
        setPos([lat, lng]);
        
        if (progress < 1) {
          animationFrame.current = requestAnimationFrame(animate);
        }
      };
      
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [targetLat, targetLng, duration]);

  return pos;
}
