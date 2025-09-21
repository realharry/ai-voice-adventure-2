import React, { useEffect, useState } from 'react';

interface StatusEffectParticlesProps {
  status: string;
}

const particleConfig = {
  poisoned: { className: 'poison', count: 15 },
  cursed: { className: 'poison', count: 15 },
  weakened: { className: 'poison', count: 15 },
  blessed: { className: 'blessed', count: 20 },
  strengthened: { className: 'blessed', count: 20 },
  hasted: { className: 'blessed', count: 20 },
};

const StatusEffectParticles: React.FC<StatusEffectParticlesProps> = ({ status }) => {
  const [particles, setParticles] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const lowerStatus = status.toLowerCase();
    const configKey = Object.keys(particleConfig).find(key => lowerStatus.includes(key));
    
    if (!configKey) return;

    const config = particleConfig[configKey as keyof typeof particleConfig];
    const newParticles = Array.from({ length: config.count }).map((_, i) => {
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 8 + 4}px`,
        height: `${Math.random() * 8 + 4}px`,
        animationDelay: `${Math.random() * 0.5}s`,
      };
      return <div key={i} className={`particle ${config.className}`} style={style} />;
    });
    setParticles(newParticles);
  }, [status]);

  if (particles.length === 0) return null;

  return (
    <div className="particle-container">
      {particles}
    </div>
  );
};

export default StatusEffectParticles;
