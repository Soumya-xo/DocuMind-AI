import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2 } from "lucide-react";

import DocuMindDashboardLayout from "../../layouts/DocuMindDashboardLayout.jsx";
import { updateUserProfile } from "../../services/userService.js";
import Avatar from "../../components/Avatar.jsx";

const ProfileSettings = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const [name, setName] = useState(user?.name || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `${user.avatar}` : "",
  );

  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    setAvatarFile(file || null);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await updateUserProfile(formData);
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Failed to update profile.");
      }

      const updatedUser = res.data.user;
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          ...updatedUser,
        }),
      );

      // Trigger reactive avatar updates without page refresh.
      window.dispatchEvent(new Event("userUpdated"));

      // optional: keep token unchanged
      alert("Profile updated successfully!");
      navigate("/settings");
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DocuMindDashboardLayout>
      <div className="px-1">
        <div className="mb-4">
          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white"
          >
            Profile
          </motion.h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Update your personal information.
          </p>
        </div>

        <section className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 flex items-center justify-center overflow-hidden">
                  {/* Preview image during selection; otherwise global Avatar fallback */}
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover rounded-full"
                      onError={() => setAvatarPreview("")}
                    />
                  ) : (
                    <Avatar user={{ ...user, name, avatar: "" }} size="xl" />
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-2xl bg-slate-900 text-white p-2 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Full name
                    </p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      placeholder="Your name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Email (read-only)
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Account created
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-IN")
                        : ""}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.updatedAt
                        ? new Date(user.updatedAt).toLocaleDateString("en-IN")
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default ProfileSettings;
