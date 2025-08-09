import React from 'react';

interface PlayerHeaderProps {
  name: string;
  imageUrl: string;
  location: string;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ name, imageUrl, location }) => {
  return (
    <div className="flex items-center space-x-4">
      <img src={imageUrl || '/logo.png'} alt={name} className="w-24 h-24 rounded-full" />
      <div>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-muted-foreground">{location}</p>
      </div>
    </div>
  );
};

export default PlayerHeader;
