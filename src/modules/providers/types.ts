export interface RawProfileData {
  username: string;
  platformUserId?: string | null;
  platformSecUid?: string | null;
  platformRoomId?: string | null;
  displayName: string;
  avatarUrl: string | null;
  accountCreatedAt: string | null;
  accountCreatedAtSource: "profile_create_time" | "user_id_timestamp" | null;
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
  /** ISO 3166-1 alpha-2 registration region returned by TikTok Research API. */
  regionCode: string | null;
  /** Country code exposed as locationCreated in TikTok's public video page payload. */
  locationCreated: string | null;
}

export interface RawLiveStatus {
  isLive: boolean;
  startedAt: string | null;
  viewerCount: number | null;
  /** Exact TikTok LIVE Creator League, for example C1 or A3. */
  creatorLeague: import("./tiktok/live-league").TikTokLiveCreatorLeague | null;
  creatorLeagueClassType: number | null;
  creatorLeagueSource: import("./tiktok/live-league").TikTokLiveCreatorLeagueSource | null;
  /** Numeric TikTok account level shown inside LIVE, for example level 23. */
  accountLevel: number | null;
  accountLevelSource: import("./tiktok/live-account-level").TikTokLiveAccountLevelSource | null;
}

export interface DataProvider {
  key: "tiktok" | "instagram" | "youtube" | "kick" | "twitch";
  fetchProfile(username: string): Promise<RawProfileData>;
  fetchRecentContent(username: string, limit?: number): Promise<RawContentItem[]>;
  fetchLiveStatus?(username: string, profile?: RawProfileData): Promise<RawLiveStatus | null>;
}
