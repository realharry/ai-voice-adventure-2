import React from 'react';
import type { SpeechSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SpeechSettings;
  onSettingsChange: (newSettings: Partial<SpeechSettings>) => void;
  voices: SpeechSynthesisVoice[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange, voices }) => {
  if (!isOpen) return null;

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ voiceURI: e.target.value });
  };
  
  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onSettingsChange({ enabled: e.target.checked });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Voice & Narration Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">&times;</button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <label htmlFor="enable-narration" className="font-semibold text-lg text-slate-200">
              Enable Story Narration
            </label>
            <input
              type="checkbox"
              id="enable-narration"
              checked={settings.enabled}
              onChange={handleEnabledChange}
              className="form-checkbox h-6 w-6 text-cyan-500 bg-slate-700 border-slate-500 rounded focus:ring-2 focus:ring-offset-slate-800 focus:ring-offset-2 focus:ring-cyan-500"
            />
          </div>

          {settings.enabled && (
            <div className="space-y-2">
              <label htmlFor="voice-select" className="font-semibold text-slate-300">
                Narration Voice
              </label>
              <select
                id="voice-select"
                value={settings.voiceURI || ''}
                onChange={handleVoiceChange}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                disabled={voices.length === 0}
              >
                {voices.length > 0 ? (
                  voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))
                ) : (
                  <option>No voices available</option>
                )}
              </select>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
            <button onClick={onClose} className="px-6 py-2 font-semibold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-500 transition-colors">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
