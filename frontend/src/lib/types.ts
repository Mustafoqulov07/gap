export type Role = "USER" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type GapStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type RoundStatus = "PENDING" | "ACTIVE" | "COMPLETED";

export interface SessionUser {
  id: number;
  fullName: string;
  phone: string;
  role: Role;
  avatar?: string | null;
  deviceId?: number;
}

export interface User {
  id: number;
  fullName: string;
  phone: string;
  avatar: string | null;
  role: Role;
  status?: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export type PublicUser = Pick<User, "id" | "fullName" | "phone" | "avatar">;

export interface GapMember {
  id: number;
  gapId: number;
  userId: number;
  joinAt: string;
  user: PublicUser;
}

export interface Gap {
  id: number;
  name: string;
  description: string | null;
  organizerId: number;
  maxMembers: number;
  monthlyAmount: number;
  duration: number;
  status: GapStatus;
  createdAt: string;
  updatedAt: string;
  members?: GapMember[];
  organizer?: PublicUser;
}

export interface Round {
  id: number;
  gapId: number;
  roundNumber: number;
  receiverId: number;
  status: RoundStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  receiver?: PublicUser;
}

export interface Device {
  id: number;
  device: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  roundId: number;
  userId: number;
  amount: number;
  status: "PENDING" | "PAID";
  createdAt: string;
}
