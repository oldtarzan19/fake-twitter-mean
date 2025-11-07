export type UserRole = 'user' | 'admin';

export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  role: UserRole;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithStats {
  user: User;
  stats: {
    followersCount: number;
    followingCount: number;
    tweetsCount: number;
  };
  relationship?: {
    isSelf: boolean;
    isFollowing: boolean;
    isFollower: boolean;
  };
}
