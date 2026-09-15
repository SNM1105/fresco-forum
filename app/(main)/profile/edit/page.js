"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile, updateProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

function PositionControl({ label, position, onChange }) {
  const [x = 50, y = 50] = position.split(" ").map((value) => Number.parseInt(value, 10));

  function setPosition(axis, value) {
    const nextX = axis === "x" ? value : x;
    const nextY = axis === "y" ? value : y;
    onChange(`${nextX}% ${nextY}%`);
  }

  return (
    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-700 mb-2">{label} position</p>
      <label className="flex items-center gap-3 text-xs text-gray-600">
        <span className="w-10">Left</span>
        <input type="range" min="0" max="100" value={x} onChange={(e) => setPosition("x", e.target.value)} className="flex-1 accent-orange-500" />
        <span className="w-9 text-right">{x}%</span>
      </label>
      <label className="flex items-center gap-3 text-xs text-gray-600 mt-2">
        <span className="w-10">Top</span>
        <input type="range" min="0" max="100" value={y} onChange={(e) => setPosition("y", e.target.value)} className="flex-1 accent-orange-500" />
        <span className="w-9 text-right">{y}%</span>
      </label>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [program, setProgram] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarPosition, setAvatarPosition] = useState("50% 50%");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerPosition, setBannerPosition] = useState("50% 50%");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setUser(session.user);

    // Get current profile
    const result = await getCurrentUserProfile();
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setProfile(result.profile);
    setDisplayName(result.profile.display_name || "");
    setBio(result.profile.bio || "");
    setSchool(result.profile.school || "");
    setProgram(result.profile.program || "");
    setAvatarPosition(result.profile.avatar_position || "50% 50%");
    setBannerPosition(result.profile.banner_position || "50% 50%");
    
    // Set avatar preview if exists
    if (result.profile.avatar_url) {
      setAvatarPreview(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-media/${result.profile.avatar_url}`);
    }
    if (result.profile.banner_url) {
      setBannerPreview(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-media/${result.profile.banner_url}`);
    }
    
    setLoading(false);
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleBannerChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setBannerPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("display_name", displayName);
    formData.append("bio", bio);
    formData.append("school", school);
    formData.append("program", program);
    formData.append("avatar_position", avatarPosition);
    formData.append("banner_position", bannerPosition);
    
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }
    if (bannerFile) {
      formData.append("banner", bannerFile);
    }

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/profile/${profile.username}`);
      }, 1000);
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6 text-center">Please sign in to edit your profile.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <a href={`/profile/${profile?.username}`} className="text-blue-500 hover:underline text-sm">
          View profile
        </a>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Profile updated! Redirecting...
          </div>
        )}

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Banner</label>
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden mb-2" style={{ aspectRatio: "16/8" }}>
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" style={{ objectPosition: bannerPosition }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No banner selected
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-xs text-gray-500 mt-1">Max 10MB, JPEG/PNG/WebP</p>
          <PositionControl label="Banner" position={bannerPosition} onChange={setBannerPosition} />
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
          <div className="flex gap-4 items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" style={{ objectPosition: avatarPosition }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No photo
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Max 5MB, JPEG/PNG/WebP</p>
            </div>
          </div>
          <PositionControl label="Profile photo" position={avatarPosition} onChange={setAvatarPosition} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Your display name"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{displayName.length}/100</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Tell us about yourself..."
          />
          <p className="text-xs text-gray-500 mt-1">{bio.length}/500</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Your school"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program / field of study</label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. Film Studies"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          <strong>Note:</strong> Your username and email cannot be changed.
        </p>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <a
            href={`/profile/${profile?.username}`}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
