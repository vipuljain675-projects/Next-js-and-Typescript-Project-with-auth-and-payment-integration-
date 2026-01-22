import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useGSAPFadeIn = (delay: number = 0) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: 'power3.out',
        }
      );
    }
  }, [delay]);

  return ref;
};

export const useGSAPSlideIn = (direction: 'left' | 'right' = 'left', delay: number = 0) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const xValue = direction === 'left' ? -100 : 100;
      gsap.fromTo(
        ref.current,
        { opacity: 0, x: xValue },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          delay,
          ease: 'power3.out',
        }
      );
    }
  }, [direction, delay]);

  return ref;
};