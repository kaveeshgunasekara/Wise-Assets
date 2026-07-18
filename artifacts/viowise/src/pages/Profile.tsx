import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import AvatarImage from "@/components/AvatarImage";
import { useApp } from "@/hooks/use-app";
import TopicSelect from "@/components/TopicSelect";
import { getUserById, updateUser } from "@/services/api";
import { supabase } from "@/services/supabase";
import { AGE_ROLE_EXPLANATION, MENTOR_MIN_AGE, roleForAge } from "@/lib/age-role";

async function resizeImageToBlob(file: File, maxPx = 500): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not available")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error("Image conversion failed")); },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image failed to load")); };
    img.src = objectUrl;
  });
}

export default function Profile() {
  const { user, setUser } = useApp();

  const [selectedTopics, setSelectedTopics] = useState<string[]>(user?.topics ?? []);
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [ageInput, setAgeInput] = useState(user?.age ? String(user.age) : "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [languagesInput, setLanguagesInput] = useState((user?.languages ?? []).join(", "));
  const [availabilityInput, setAvailabilityInput] = useState((user?.availability ?? []).join(", "));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getUserById(user.id).then((fresh) => {
      if (!fresh) return;
      setUser(fresh);
      setSelectedTopics(fresh.topics ?? []);
      setDisplayName(fresh.name ?? "");
      setAgeInput(fresh.age ? String(fresh.age) : "");
      setBio(fresh.bio ?? "");
      setLanguagesInput((fresh.languages ?? []).join(", "));
      setAvailabilityInput((fresh.availability ?? []).join(", "));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const ageNumber = Number(ageInput);
  const derivedRole = roleForAge(ageNumber);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Only JPG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarSaved(false);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const blob = await resizeImageToBlob(avatarFile);
      const path = `${user.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const updated = await updateUser(user.id, { avatar_url: publicUrl });
      setUser(updated ?? { ...user, avatar_url: publicUrl });
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 3000);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!derivedRole) {
      setAgeError("Please enter a valid age so we know whether you're a mentor or learner.");
      return;
    }
    setAgeError(null);
    setSaving(true);

    const updates = {
      name: displayName,
      topics: selectedTopics,
      age: ageNumber,
      role: derivedRole,
      bio,
      languages: languagesInput.split(",").map((l) => l.trim()).filter(Boolean),
      availability: availabilityInput.split(",").map((a) => a.trim()).filter(Boolean),
    };
    const updated = await updateUser(user.id, updates);
    setUser(updated ?? { ...user, ...updates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  if (!user) return null;

  const avatarDisplayUser = avatarPreview
    ? { ...user, avatar_url: avatarPreview }
    : user;

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-[40px] font-serif text-foreground mb-8">Your Profile</h1>

        <form onSubmit={handleSave} className="space-y-10">

          {/* ── Photo section ─────────────────────────────────────────────── */}
          <div className="bg-white p-8 rounded-[16px] card-shadow">
            <h2 className="text-[18px] font-medium mb-6">Profile photo</h2>
            <div className="flex items-center gap-6">
              <AvatarImage user={avatarDisplayUser} className="w-24 h-24 text-3xl shrink-0" />
              <div className="flex flex-col gap-3">
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-[10px] text-[15px] font-medium cursor-pointer hover:bg-secondary transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {user.avatar_url && !avatarFile ? "Change photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </label>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="px-5 py-2.5 bg-primary text-white rounded-[10px] text-[15px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
                  >
                    {uploadingAvatar ? "Uploading…" : "Save photo"}
                  </button>
                )}
                {avatarError && (
                  <p className="text-destructive text-[14px]" role="alert">{avatarError}</p>
                )}
                {avatarSaved && (
                  <p className="text-success text-[14px] font-medium flex items-center gap-1.5" aria-live="polite">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Photo saved!
                  </p>
                )}
                <p className="text-[13px] text-foreground/50">JPG, PNG or WebP · max 5 MB</p>
              </div>
            </div>
          </div>

          {/* ── Topics ───────────────────────────────────────────────────── */}
          <div className="bg-white p-8 rounded-[16px] card-shadow">
            <TopicSelect selected={selectedTopics} onToggle={toggleTopic} />
          </div>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <div className="bg-white p-8 rounded-[16px] card-shadow space-y-6">
            <div>
              <label className="block text-[16px] font-medium mb-2">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Age</label>
              <input
                type="number"
                required
                min={13}
                max={120}
                value={ageInput}
                onChange={(e) => { setAgeInput(e.target.value); setAgeError(null); }}
                placeholder="Your age"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
              <p className="mt-2 text-[14px] text-foreground/60">{AGE_ROLE_EXPLANATION}</p>
              {derivedRole && (
                <p className="mt-3 flex items-center gap-3 text-[16px]" aria-live="polite">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-serif text-sm" aria-hidden="true">
                    {derivedRole === "mentor" ? "M" : "L"}
                  </span>
                  <span className="text-foreground/80">
                    You're a{" "}
                    <span className="font-medium text-foreground">
                      {derivedRole === "mentor" ? "Mentor" : "Learner"}
                    </span>
                    {user.role !== derivedRole && " — saving will update your role to match your age."}
                  </span>
                </p>
              )}
              {ageError && (
                <p className="mt-3 text-[16px] text-destructive" role="alert">{ageError}</p>
              )}
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">One-line life experience</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Retired nurse, 35 years in paediatrics"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Languages (comma-separated)</label>
              <input
                type="text"
                value={languagesInput}
                onChange={(e) => setLanguagesInput(e.target.value)}
                placeholder="e.g. English, Mandarin"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Availability (comma-separated)</label>
              <input
                type="text"
                value={availabilityInput}
                onChange={(e) => setAvailabilityInput(e.target.value)}
                placeholder="e.g. Weekday mornings, Weekend afternoons"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="submit"
              disabled={saving}
              className="px-8 bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="text-success font-medium flex items-center gap-2" aria-live="polite">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Profile updated.
              </span>
            )}
          </div>
          <p className="text-foreground/60 text-[16px]">Your matches update automatically when your profile changes.</p>
        </form>
      </main>
    </div>
  );
}
