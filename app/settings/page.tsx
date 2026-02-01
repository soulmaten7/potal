"use client";

import { useSupabase } from "../context/SupabaseProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PRESET_KEYWORDS = [
  "LEGO",
  "Electronics",
  "Camping",
  "Parenting",
  "Fashion",
  "Sports",
  "Toys",
  "Home & Kitchen",
  "Gaming",
  "Books",
  "Beauty",
  "Automotive",
  "Pet Supplies",
  "Outdoor",
  "Fitness",
];

export default function SettingsPage() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [interestKeywords, setInterestKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname, interest_keywords")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Load profile error:", error);
        return;
      }
      if (data) {
        setNickname(data.nickname ?? "");
        setInterestKeywords(Array.isArray(data.interest_keywords) ? data.interest_keywords : []);
      }
    } catch (e) {
      console.error("Load profile failed:", e);
    } finally {
      setLoading(false);
    }
  }, [supabase, session?.user?.id]);

  useEffect(() => {
    if (!session) {
      router.replace("/");
      return;
    }
    loadProfile();
  }, [session, router, loadProfile]);

  const toggleKeyword = (keyword: string) => {
    setInterestKeywords((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  };

  const addCustomKeyword = () => {
    const trimmed = customKeyword.trim();
    if (!trimmed || interestKeywords.includes(trimmed)) return;
    setInterestKeywords((prev) => [...prev, trimmed]);
    setCustomKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    setInterestKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: session.user.id,
          email: session.user.email ?? "",
          nickname: nickname.trim() || null,
          interest_keywords: interestKeywords,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (error) throw error;
      setMessage({ type: "ok", text: "Settings saved." });
    } catch (e) {
      console.error("Save profile failed:", e);
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to save. Check that the profiles table exists.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <Link
            href="/"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Back to Search
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Personal profile */}
          <section className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Personal profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={session.user?.email ?? ""}
                  readOnly
                  className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed md:h-auto md:py-2"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full h-12 px-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 md:h-auto md:py-2"
                />
              </div>
            </div>
          </section>

          {/* Interests / keywords */}
          <section className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Interests & keywords
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select or add keywords so AI can personalize your search results.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_KEYWORDS.map((kw) => {
                const selected = interestKeywords.includes(kw);
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => toggleKeyword(kw)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selected
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {interestKeywords
                .filter((k) => !PRESET_KEYWORDS.includes(k))
                .map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="text-indigo-600 hover:text-indigo-800"
                      aria-label={`Remove ${kw}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomKeyword())}
                placeholder="Add custom keyword..."
                className="flex-1 h-12 px-3 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 md:h-auto md:py-2"
              />
              <button
                type="button"
                onClick={addCustomKeyword}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
          </section>

          {/* Save + message */}
          <div className="p-6">
            {message && (
              <p
                className={`mb-4 text-sm ${
                  message.type === "ok" ? "text-green-600" : "text-red-600"
                }`}
              >
                {message.text}
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await supabase?.auth.signOut();
                } catch (e) {
                  console.error("Sign out failed:", e);
                }
              }}
              className="w-full mt-4 py-3 rounded-lg border border-gray-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
