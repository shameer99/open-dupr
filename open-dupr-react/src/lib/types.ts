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
    singlesReliabilityScore?: number;
    doublesReliabilityScore?: number;
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
  singlesRating?: string;
  doublesRating?: string;
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
    singlesReliabilityScore?: number;
    doublesReliabilityScore?: number;
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
