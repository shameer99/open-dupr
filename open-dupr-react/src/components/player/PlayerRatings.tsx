import React from 'react';

interface PlayerRatingsProps {
  singles: string;
  doubles: string;
}

const PlayerRatings: React.FC<PlayerRatingsProps> = ({ singles, doubles }) => {
  return (
    <div>
      <h2 className="text-xl font-bold">Ratings</h2>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="text-lg font-semibold">{singles}</p>
          <p className="text-muted-foreground">Singles</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{doubles}</p>
          <p className="text-muted-foreground">Doubles</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerRatings;
