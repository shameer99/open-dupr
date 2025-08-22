export interface Player {
  id: number;
  fullName: string;
  imageUrl: string;
  location: string;
  birthdate?: string;
  gender?: string;
  age?: number;
  stats: {
    singles: string;
    doubles: string;
  };
  addresses?: {
    formattedAddress: string;
  }[];
}

export interface FollowUser {
  id: number;
  name: string;
  profileImage: string;
  isFollow: boolean;
}

export interface FollowInfo {
  isFollowed: boolean;
  followers: number;
  followings: number;
}

export interface MatchRatings {
  averagePartnerDupr: number;
  averageOpponentDupr: number;
}

export interface RatingsOverview {
  wins: number;
  losses: number;
  pending: number;
}

export interface UserStats {
  singles: MatchRatings;
  doubles: MatchRatings;
  resulOverview: RatingsOverview;
}

export interface OtherUserProfile {
  id: number;
  fullName: string;
  imageUrl: string;
  location?: string;
  birthdate?: string;
  gender?: string;
  age?: number;
  stats?: {
    singles: string;
    doubles: string;
  };
  followInfo?: FollowInfo;
  calculatedStats?: UserStats;
}

export interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  logout: () => void;
}

export type PlayerRef = {
  id?: number;
  fullName: string;
  imageUrl?: string;
  rating?: string;
  preRating?: string;
  postRating?: string;
  validatedMatch?: boolean;
};

export type MatchTeam = {
  id?: number;
  serial?: number;
  player1: PlayerRef;
  player2?: PlayerRef | null;
  winner?: boolean;
  delta?: string;
  teamRating?: string;
  game1?: number;
  game2?: number;
  game3?: number;
  game4?: number;
  game5?: number;
  preMatchRatingAndImpact?: Record<string, string | number | null | undefined>;
};

export type Match = {
  id: number;
  venue?: string;
  location?: string;
  tournament?: string;
  eventDate?: string;
  eventFormat?: string;
  teams: MatchTeam[];
  noOfGames?: number;
  confirmed?: boolean;
};

export interface FeedItem {
  match: Match;
}
