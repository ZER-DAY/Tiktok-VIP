export interface RawProfileData {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  isVerified: boolean;
  accountType: "personal" | "business" | "unknown";
  followers: number;
  following: number;
  totalLikes: number;
  videoCount: number;
}

export interface RawContentItem {
  id: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  duration: number;
  hashtags: string[];
}

export interface RawLiveStatus {
  isLive: boolean;
  startedAt: string | null;
  viewerCount: number | null;
}

export interface DataProvider {
  key: "tiktok" | "instagram" | "youtube" | "kick" | "twitch";
  fetchProfile(username: string): Promise<RawProfileData>;
  fetchRecentContent(username: string, limit?: number): Promise<RawContentItem[]>;
  fetchLiveStatus?(username: string): Promise<RawLiveStatus | null>;
}
