import React from "react";

interface PlayerRatingsProps {
  singles?: string | number | null;
  doubles?: string | number | null;
}

const formatRating = (value: unknown): string => {
  if (value == null) return "-";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(3) : "-";
  }
  // Preserve provided strings as-is (e.g., "NR" or "3.446")
  const text = String(value).trim();
  return text.length > 0 ? text : "-";
};

const PlayerRatings: React.FC<PlayerRatingsProps> = ({ singles, doubles }) => {
  useEffect(() => {
    // Quick debug for Safari vs Chrome behavior

    console.log("[PlayerRatings] props", {
      singles,
      doubles,
      typeofSingles: typeof singles,
      typeofDoubles: typeof doubles,
    });
  }, [singles, doubles]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="text-lg font-semibold">{formatRating(singles)}</p>
          <p className="text-muted-foreground">Singles</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{formatRating(doubles)}</p>
          <p className="text-muted-foreground">Doubles</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerRatings;
