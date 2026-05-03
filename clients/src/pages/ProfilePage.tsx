import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { cn, getErrorMessage } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type {
  UserProfile,
  IdentityEmploymentType,
} from "@/types";

import {
  Edit2,
  GraduationCap,
  Loader2,
  Camera,
  Users,
  Eye,
  TrendingUp,
  Building2,
  Plus,
  Link as LinkIcon,
  Check,
  X,
  Save
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────

const fullName = (p: UserProfile) =>
  [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  try {
    return format(new Date(d), "MMM yyyy");
  } catch {
    return d;
  }
};

const empLabel: Record<IdentityEmploymentType, string> = {
  Full_time: "Full-time",
  Part_time: "Part-time",
  Internship: "Internship",
  Freelance: "Freelance",
  Contract: "Contract",
  Other: "Other",
};

// ─── Zod Schema for Inline Editing ────────────────────────────────────
const aboutSchema = z.object({
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters"),
});

// ─── Component ────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const { id: paramId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("about");
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Inline Edit State
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  const isOwner = !paramId || paramId === authUser?.userId;

  // ─── React Query: Fetch Profile ───
  const { data: profile, isLoading: loading } = useQuery<UserProfile>({
    queryKey: ["profile", isOwner ? "me" : paramId],
    queryFn: async () => {
      const endpoint = isOwner ? "/identity/users/me" : `/identity/users/${paramId}`;
      const res = await api.get(endpoint);
      return res.data;
    },
    // Don't refetch on window focus to prevent annoying layout jumps during inline editing
    refetchOnWindowFocus: false, 
  });

  // ─── React Query: Update Bio (Inline Edit) ───
  const updateBioMutation = useMutation({
    mutationFn: async (bio: string) => {
      await api.patch("/identity/users/me", { bio });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("About section updated");
      setIsEditingAbout(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    }
  });

  // ─── React Hook Form ───
  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof aboutSchema>>({
    resolver: zodResolver(aboutSchema),
    defaultValues: { bio: profile?.bio || "" },
  });

  // Reset form when profile data initially loads
  if (profile && !isEditingAbout && profile.bio !== undefined) {
      // Small trick: we set default values when editing starts instead
  }

  const startEditingAbout = () => {
    reset({ bio: profile?.bio || "" });
    setIsEditingAbout(true);
  };

  const onAboutSubmit = (data: z.infer<typeof aboutSchema>) => {
    updateBioMutation.mutate(data.bio);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Profile not found
      </div>
    );
  }

  const name = fullName(profile);
  const sortedExp = [...(profile.experiences || [])].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
  const sortedEdu = [...(profile.educations || [])].sort(
    (a, b) =>
      new Date(b.start_date || b.created_at).getTime() -
      new Date(a.start_date || a.created_at).getTime()
  );

  const currentExp = sortedExp.find(e => !e.end_date) || sortedExp[0];
  const currentEdu = sortedEdu.find(e => !e.end_date) || sortedEdu[0];

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile/${profile.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Public profile link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ─── Dynamic Role Badge Logic ───
  let roleBadge = null;
  if (profile.role === "Student") {
    roleBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
        Seeking Internships
      </span>
    );
  } else if (profile.role === "Alumni") {
    // Just an example condition - maybe randomize or toggle based on some db flag. Default to Emerald for mentoring
    roleBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
        Open to Mentoring
      </span>
    );
  } else if (profile.role === "Admin") {
    roleBadge = (
       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
        System Admin
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-6xl pb-8 px-4 sm:px-6 lg:px-8 mt-6">
      {/* ════════════════ MAIN LAYOUT (2-COLUMN GRID) ════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (Main Content - 2/3) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Header/Banner Section */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden relative">
            {/* Banner */}
            <div className="relative h-48 sm:h-60 bg-slate-200">
              {profile.header_img ? (
                <img
                  src={profile.header_img}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-slate-200 to-slate-300" />
              )}
              {isOwner && (
                <button className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white flex items-center justify-center cursor-pointer">
                  <Camera className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Profile Info Area */}
            <div className="relative px-6 pb-6">
              {/* Profile Picture */}
              <div className="absolute -top-20 left-6 rounded-full border-4 border-card shadow-sm bg-white overflow-hidden h-36 w-36">
                <UserAvatar
                  name={name}
                  avatar={profile.profile_pic || undefined}
                  size="xl"
                  className="h-full w-full rounded-none"
                />
              </div>

              {/* Edit / Public Link Buttons */}
              <div className="flex justify-end pt-4 mb-2 h-10 gap-2">
                 <button 
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-md transition-colors flex items-center gap-1.5"
                  title="Copy Public Link"
                 >
                   {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <LinkIcon className="h-4 w-4" />}
                   {copiedLink ? "Copied!" : "Public Link"}
                 </button>
                 {isOwner && (
                  <button className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors flex items-center justify-center shrink-0">
                    <Edit2 className="h-[18px] w-[18px]" />
                  </button>
                 )}
              </div>

              {/* Name and Headline */}
              <div className="mt-8 flex flex-col md:flex-row md:justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-card-foreground leading-tight">
                      {name}
                    </h1>
                    {roleBadge}
                  </div>
                  
                  {profile.headline && (
                    <p className="text-[16px] text-foreground mt-1">
                      {profile.headline}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {profile.residence && (
                      <>
                        <span className="flex items-center gap-1">
                          {profile.residence}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span className="text-primary cursor-pointer hover:underline font-semibold">
                      Contact info
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm text-primary font-semibold hover:underline cursor-pointer">
                    <Users className="h-4 w-4" />
                    500+ connections
                  </div>

                  {isOwner && (
                    <div className="flex gap-2 shrink-0 pt-4 flex-wrap">
                      <Button className="rounded-full px-5 bg-primary text-primary-foreground hover:bg-primary/90">
                        Open to
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full px-5 border-primary text-primary hover:bg-primary/5"
                      >
                        Add profile section
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full px-5 border-slate-400 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        More
                      </Button>
                    </div>
                  )}
                </div>

                {/* Current Position / Education */}
                <div className="md:w-64 space-y-3 shrink-0 flex flex-col text-sm font-semibold">
                  {currentExp && (
                    <div className="flex items-center gap-3 hover:text-primary cursor-pointer hover:underline transition-colors w-max">
                      <Building2 className="h-5 w-5 text-slate-700" />
                      <span className="truncate">{currentExp.company}</span>
                    </div>
                  )}
                  {currentEdu && (
                    <div className="flex items-center gap-3 hover:text-primary cursor-pointer hover:underline transition-colors w-max">
                      <GraduationCap className="h-5 w-5 text-slate-700" />
                      <span className="truncate">{currentEdu.institution}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar (Sub-nav) */}
          <div className="rounded-xl border bg-card shadow-sm px-2 overflow-x-auto scrollbar-none sticky top-16 z-10">
            <div className="flex border-b border-transparent">
              {(["about", "posts", "experience", "education"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => scrollToSection(tab)}
                    className={cn(
                      "px-6 py-4 text-[15px] font-semibold capitalize transition-all whitespace-nowrap border-b-2 hover:bg-slate-50",
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-600 hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Core Sections */}
          <div className="space-y-6">
            
            {/* About Section (With Inline Editing) */}
            <div id="about" className="rounded-xl border bg-card shadow-sm p-6 relative group scroll-mt-36">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">
                  About
                </h2>
                {isOwner && !isEditingAbout && (
                  <button onClick={startEditingAbout} className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors hidden sm:flex opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Edit2 className="h-5 w-5" />
                  </button>
                )}
              </div>

              {isEditingAbout ? (
                <form onSubmit={handleSubmit(onAboutSubmit)} className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <Textarea 
                    {...register("bio")}
                    placeholder="Write a summary to highlight your personality or work experience..."
                    className="min-h-[120px]"
                  />
                  {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingAbout(false)}>
                      <X className="h-4 w-4 mr-1.5" /> Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={updateBioMutation.isPending}>
                      {updateBioMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin"/> : <Save className="h-4 w-4 mr-1.5" />}
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line line-clamp-[10] hover:line-clamp-none transition-all">
                  {profile.bio ||
                    (isOwner
                      ? "Write a summary to highlight your personality or work experience."
                      : "No summary provided.")}
                </p>
              )}
            </div>

            {/* Experience Section */}
            <div id="experience" className="rounded-xl border bg-card shadow-sm p-6 relative group scroll-mt-36">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Experience
                </h2>
                {isOwner && (
                  <div className="flex gap-2">
                    <button className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors hidden sm:flex opacity-0 group-hover:opacity-100 cursor-pointer">
                      <Plus className="h-6 w-6" />
                    </button>
                  </div>
                )}
              </div>

              {sortedExp.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No experience added yet
                </p>
              ) : (
                <div className="space-y-6">
                  {sortedExp.map((exp) => (
                    <div key={exp.id} className="flex gap-4 group/item relative">
                      {/* Timeline Line (Optional visual detail) */}
                      {sortedExp.length > 1 && <div className="absolute left-[34px] top-16 bottom-[-24px] w-[2px] bg-slate-200 group-last/item:hidden" />}
                      
                      {/* Company Logo Placeholder */}
                      <div className="mt-1 h-[68px] w-[68px] shrink-0 flex items-center justify-center bg-slate-100/80 border shadow-sm rounded-md hover:bg-slate-200 transition-colors cursor-pointer z-10 relative">
                        <Building2 className="h-8 w-8 text-slate-500" />
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-card-foreground text-[16px]">
                              {exp.title}
                            </h3>
                            <p className="text-[15px] text-slate-800">
                              {exp.company}
                              {exp.emp_type && (
                                <span className="font-normal text-slate-600">
                                  {" "}
                                  · {empLabel[exp.emp_type]}
                                </span>
                              )}
                            </p>
                            <p className="text-[14px] text-slate-500 mt-0.5">
                              {fmtDate(exp.start_date)} –{" "}
                              {exp.end_date ? fmtDate(exp.end_date) : "Present"}
                              {exp.location && ` · ${exp.location}`}
                            </p>
                          </div>
                          {isOwner && (
                            <button className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors opacity-0 group-hover/item:opacity-100 hidden sm:flex cursor-pointer mt-0.5">
                              <Edit2 className="h-[18px] w-[18px]" />
                            </button>
                          )}
                        </div>
                        {exp.description && (
                          <p className="mt-3 text-[14px] text-slate-800 leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education Section */}
            <div id="education" className="rounded-xl border bg-card shadow-sm p-6 relative group scroll-mt-36">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Education
                </h2>
                {isOwner && (
                  <div className="flex gap-2">
                    <button className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors hidden sm:flex opacity-0 group-hover:opacity-100 cursor-pointer">
                      <Plus className="h-6 w-6" />
                    </button>
                  </div>
                )}
              </div>

              {sortedEdu.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No education added yet
                </p>
              ) : (
                <div className="space-y-6">
                  {sortedEdu.map((edu) => (
                    <div key={edu.id} className="flex gap-4 group/item relative">
                       {sortedEdu.length > 1 && <div className="absolute left-[34px] top-16 bottom-[-24px] w-[2px] bg-slate-200 group-last/item:hidden" />}

                      <div className="mt-1 h-[68px] w-[68px] shrink-0 flex items-center justify-center bg-slate-100/80 border shadow-sm rounded-md hover:bg-slate-200 transition-colors cursor-pointer z-10 relative">
                        <GraduationCap className="h-8 w-8 text-slate-500" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-card-foreground text-[16px]">
                              {edu.institution}
                            </h3>
                            <p className="text-[15px] text-slate-800">
                              {[edu.degree, edu.field_of_study]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                            <p className="text-[14px] text-slate-500 mt-0.5">
                              {fmtDate(edu.start_date)} –{" "}
                              {edu.end_date ? fmtDate(edu.end_date) : "Present"}
                            </p>
                          </div>
                          {isOwner && (
                            <button className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors opacity-0 group-hover/item:opacity-100 hidden sm:flex cursor-pointer mt-0.5">
                              <Edit2 className="h-[18px] w-[18px]" />
                            </button>
                          )}
                        </div>
                        {edu.grade && (
                          <p className="text-[14px] text-slate-800 mt-2">
                            Grade: {edu.grade}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity/Posts Dummy Section (for anchor links) */}
            <div id="posts" className="rounded-xl border bg-card shadow-sm p-6 relative group scroll-mt-36">
               <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Activity
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
               You haven't posted lately
              </p>
            </div>

          </div>
        </div>

        {/* Right Column (Sidebar - 1/3) */}
        <div className="space-y-6 block">
          
          {/* Profile Analytics */}
          {isOwner && (
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <h3 className="font-semibold text-[16px] mb-3">Analytics</h3>
              <div className="flex items-center gap-1.5 text-[14px] text-muted-foreground mb-4">
                <Eye className="h-4 w-4" />{" "}
                <span className="font-medium text-foreground">Private to you</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 border-b pb-4">
                  <span className="flex items-center gap-3 hover:underline cursor-pointer group w-max max-w-full">
                    <Users className="h-6 w-6 text-slate-600 group-hover:text-primary transition-colors shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-lg text-foreground leading-tight">342</span>
                      <span className="text-sm text-muted-foreground truncate">profile views</span>
                    </div>
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-3 hover:underline cursor-pointer group w-max max-w-full">
                    <TrendingUp className="h-6 w-6 text-slate-600 group-hover:text-primary transition-colors shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-lg text-foreground leading-tight">1,240</span>
                      <span className="text-sm text-muted-foreground truncate">post impressions</span>
                    </div>
                  </span>
                </div>
              </div>
              <button className="w-full mt-4 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 py-3 border-t text-center -mx-5 px-5 -mb-5 rounded-b-xl border-x-0 border-b-0 transition-colors">
                Show all analytics
              </button>
            </div>
          )}

          {/* People Also Viewed */}
          <div className="rounded-xl border bg-card shadow-sm p-5 hidden md:block">
            <h3 className="font-semibold text-[16px] mb-4 text-card-foreground">
              People also viewed
            </h3>
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <UserAvatar name={`User ${i}`} size="md" className="h-12 w-12" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-semibold text-foreground hover:text-primary hover:underline cursor-pointer transition-colors truncate">
                      Demo User {i}
                    </h4>
                    <p className="text-[13px] text-muted-foreground leading-snug line-clamp-2 mt-0.5" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      Software Engineer | CS Undergrad @ University of Peradeniya
                    </p>
                    <button className="mt-2 rounded-full border border-slate-400 px-4 py-1 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors w-max">
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
