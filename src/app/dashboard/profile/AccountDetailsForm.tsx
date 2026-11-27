"use client";

import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { type FormEvent, useEffect, useState } from "react";
import AccountLogo from "@/app/components/AccountLogo";
import apiClient from "@/app/services/apiClient";
import { getSessionToken } from "@/lib/session";
import BASE_URL from "@/app/urlConfig/urlConfig";
import { type User, useAuth } from "@/context/AuthContext";

const profileUrl = `${BASE_URL}/api/profile`;

const fields = [
  { name: "first_name", label: "First name", required: true },
  { name: "middle_name", label: "Middle name" },
  { name: "last_name", label: "Last name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phonenumber", label: "Phone number", type: "tel", maxLength: 20, required: true },
  { name: "country", label: "Country", required: true },
  { name: "address", label: "Address", required: true },
  { name: "representative_full_name", label: "Representative full name" },
] as const;

const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2";

function profileHeaders() {
  const token = getSessionToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token ?? ""}`,
  };
}

function errorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    return fallback;
  }
  const data = error.response?.data;
  return Object.values(data?.errors ?? {}).flat().join(" ") || data?.message || fallback;
}

export default function AccountDetailsForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [profile, setProfile] = useState<User>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get<{ user: User }>(profileUrl, {
      headers: profileHeaders(),
      signal: controller.signal,
    }).then(({ data }) => setProfile(data.user)).catch((requestError) => {
      if (!controller.signal.aborted) {
        setError(errorMessage(requestError, "Could not load account details."));
      }
    });
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving || !profile) return;

    const form = event.currentTarget;
    const payload = new FormData(form);
    for (const { name } of fields) {
      if (payload.get(name) === (profile[name] ?? "")) payload.delete(name);
    }
    if ((payload.get("user_type") ?? "") === (profile.user_type ?? "")) payload.delete("user_type");
    const logo = payload.get("logo_uploads");
    if (!(logo instanceof File) || !logo.name) payload.delete("logo_uploads");
    if (!payload.get("current_password")) payload.delete("current_password");
    if (!payload.get("password") && !payload.get("password_confirmation")) {
      payload.delete("password");
      payload.delete("password_confirmation");
    }
    // PHP reads multipart uploads from POST requests.
    payload.set("_method", "PATCH");

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const { data } = await apiClient.post<{ user: User; message: string }>(
        profileUrl,
        payload,
        { headers: profileHeaders() },
      );
      setProfile(data.user);
      login(data.user);
      setEditing(false);
      setMessage(data.message);
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not save account details."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("Account details")}</h2>
        {profile && !editing && (
          <button
            type="button"
            className="rounded-lg bg-[#082c28] px-4 py-2 font-medium text-white"
            onClick={() => {
              setMessage("");
              setEditing(true);
            }}
          >
            {t("Edit profile")}
          </button>
        )}
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 text-sm text-green-700">{message}</p>}
      {!profile && !error && <p role="status">{t("Loading account details…")}</p>}
      {profile && !editing && (
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-600">{t("Account logo")}</dt>
            <dd className="mt-1">
              <AccountLogo
                logoPath={profile.logo_uploads}
                alt={t("Current account logo")}
                fallback="/user.svg"
                className="h-24 w-24 rounded-lg border border-gray-200 object-contain"
              />
            </dd>
          </div>
          {fields.map(({ name, label }) => (
            <div key={name}>
              <dt className="text-sm font-medium text-gray-600">{label}</dt>
              <dd className="mt-1 break-words whitespace-pre-wrap">{profile[name] || "—"}</dd>
            </div>
          ))}
          <div>
            <dt className="text-sm font-medium text-gray-600">{t("Account type")}</dt>
            <dd className="mt-1">
              {profile.user_type === "I" ? t("Individual") : profile.user_type === "C" ? t("Company") : profile.user_type || "—"}
            </dd>
          </div>
        </dl>
      )}
      {profile && editing && (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className="text-sm font-medium">
                {t(field.label)}
                <input
                  name={field.name}
                  defaultValue={profile[field.name] ?? ""}
                  type={"type" in field ? field.type : "text"}
                  maxLength={"maxLength" in field ? field.maxLength : 255}
                  required={"required" in field && field.required}
                  className={inputClass}
                />
              </label>
            ))}
            <label className="text-sm font-medium">
              {t("Account type")}
              <select name="user_type" defaultValue={profile.user_type ?? ""} className={inputClass}>
                <option value="" disabled>{t("Select account type")}</option>
                {profile.user_type && !["I", "C"].includes(profile.user_type) && (
                  <option value={profile.user_type}>{profile.user_type}</option>
                )}
                <option value="I">{t("Individual")}</option>
                <option value="C">{t("Company")}</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <AccountLogo
                logoPath={profile.logo_uploads}
                alt={t("Current account logo")}
                className="mb-3 h-24 w-24 rounded-lg border border-gray-200 object-contain"
              />
              <label className="block text-sm font-medium">
                {profile.logo_uploads ? t("Replace logo") : t("Upload logo")}
                <input
                  name="logo_uploads"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  aria-describedby="logo-help"
                  className={inputClass}
                />
              </label>
              <p id="logo-help" className="mt-1 text-sm text-gray-600">
                {t("JPEG, PNG, GIF, or WebP, up to 2 MB.")}
              </p>
            </div>
            <p className="text-sm text-gray-600 sm:col-span-2">
              {t("Enter your current password to change your email or password.")}
            </p>
            <label className="text-sm font-medium">
              {t("Current password")}
              <input name="current_password" type="password" autoComplete="current-password" className={inputClass} />
            </label>
            <label className="text-sm font-medium">
              {t("New password")}
              <input name="password" type="password" autoComplete="new-password" minLength={6} maxLength={72} className={inputClass} />
            </label>
            <label className="text-sm font-medium">
              {t("Confirm new password")}
              <input name="password_confirmation" type="password" autoComplete="new-password" className={inputClass} />
            </label>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="submit" className="rounded-lg bg-[#082c28] px-4 py-2 font-medium text-white disabled:opacity-60">
                {saving ? t("Saving…") : t("Save account details")}
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium disabled:opacity-60"
                onClick={() => {
                  setError("");
                  setEditing(false);
                }}
              >
                {t("Cancel")}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
