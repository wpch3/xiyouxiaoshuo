import React from 'react';
import { LiveAnimeModel } from './LiveAnimeModel';

export const LiveInteractiveAvatar = ({
  characterId = 'deepseek',
  form = 'normal',
  mood = 'idle',
  speechText = '',
  size = 320,
  activeTool = 'pet',
  accentColor = '#79A8F4',
  onPet = () => {},
  onPoke = () => {},
}) => (
  <LiveAnimeModel
    characterId={characterId}
    form={form}
    mood={mood}
    activeTool={activeTool}
    isSpeaking={Boolean(speechText)}
    size={size}
    accentColor={accentColor}
    onPet={onPet}
    onHammer={onPoke}
  />
);
