import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/soundManager';

export const ClickParticleCanvas = () => {
  useEffect(() => {
    const handleClick = (e) => {
      // 产生点击轻量光芒气泡特效
      try {
        confetti({
          particleCount: 12,
          spread: 45,
          startVelocity: 15,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
          },
          colors: ['#FF69B4', '#60A5FA', '#FFD700', '#A78BFA'],
          ticks: 60,
          shapes: ['circle'],
          scalar: 0.75,
          disableForReducedMotion: true
        });
      } catch (err) {}
    };

    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, []);

  return null;
};
