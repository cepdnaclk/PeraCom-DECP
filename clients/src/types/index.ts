export type UserRole = "ADMIN" | "STUDENT" | "ALUMNI";

export type ReactionType =
  | "LIKE"
  | "CELEBRATE"
  | "SUPPORT"
  | "LOVE"
  | "HAHA"
  | "INSIGHTFUL";

export type WorkMode = "ON_SITE" | "REMOTE" | "HYBRID";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "INTERNSHIP"
  | "CONTRACT";

export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export interface UserSummary {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Post {
  _id: string;
  author: Omit<UserSummary, "email" | "role">;
  content: string;
  images?: string[];
  video?: string;
  myReaction?: ReactionType | null;
  totalReactions: number;
  reactionCounts: Record<ReactionType, number>;
  commentCount: number;
  repostCount: number;
  originalPostId?: Post | null;
  isEdited: boolean;
  updatedAt?: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  author: Omit<UserSummary, "email" | "role">;
  content: string;
  isEdited: boolean;
  updatedAt: string;
}

export interface JobFeedItem {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  status: JobStatus;
  applicationCount: number;
  updatedAt: string;
}

export interface Job extends JobFeedItem {
  department: string;
  tags: string[];
  salaryRange?: string;
  postedBy: UserSummary;
  deadline: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  joinDate: string;
  bio?: string;
  graduationYear?: number;
  currentCompany?: string;
  jobTitle?: string;
  skills?: string[];
  linkedIn?: string;
  github?: string;
  online?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  name?: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  status: "draft" | "ongoing" | "completed" | "cancelled";
  owner: User;
  collaborators: User[];
  createdAt: string;
  tags: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: "seminar" | "workshop" | "alumni-talk" | "hackathon";
  date: string;
  location: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "draft";
  attendees: number;
  maxAttendees: number;
  organizer: User;
}

export interface Notification {
  id: string;
  type: "message" | "event" | "research" | "job" | "system";
  title: string;
  description: string;
  read: boolean;
  timestamp: string;
}

// ─── Identity / Profile Types ────────────────────────────────────────

export type SocialPlatform =
  | "LinkedIn"
  | "GitHub"
  | "Portfolio"
  | "Personal"
  | "Facebook"
  | "Twitter"
  | "ResearchGate"
  | "Other";

export type IdentityEmploymentType =
  | "Full_time"
  | "Part_time"
  | "Internship"
  | "Freelance"
  | "Contract"
  | "Other";

export interface ProfileSocialLink {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  url: string;
  created_at: string;
}

export interface ProfileExperience {
  id: string;
  user_id: string;
  title: string;
  emp_type: IdentityEmploymentType;
  company: string;
  start_date: string;
  end_date?: string | null;
  location?: string | null;
  description?: string | null;
  created_at: string;
}

export interface ProfileEducation {
  id: string;
  user_id: string;
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  grade?: string | null;
  created_at: string;
}

export interface ProfileProject {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
  link?: string | null;
  created_at: string;
}

export interface ProfilePublication {
  id: string;
  user_id: string;
  title: string;
  journal?: string | null;
  published_date?: string | null;
  link?: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  reg_number: string;
  email: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  residence?: string | null;
  role: UserRole;
  is_active: boolean;
  profile_pic?: string | null;
  header_img?: string | null;
  headline?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
  socialLinks: ProfileSocialLink[];
  projects: ProfileProject[];
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  publications: ProfilePublication[];
}
