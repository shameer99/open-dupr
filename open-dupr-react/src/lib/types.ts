export interface Player {
  id: number;
  fullName: string;
  imageUrl: string;
  location: string;
  stats: {
    singles: string;
    doubles: string;
  };
  addresses?: {
    formattedAddress: string;
  }[];
}

export interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
}
