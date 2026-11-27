"use client";

import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language) => {
    localStorage.setItem("lang", language);
    void i18n.changeLanguage(language);
  };

  return (
    <select
      aria-label={t("language")}
      value={i18n.language}
      onChange={(event) => changeLanguage(event.target.value)}
      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-[#082c28] focus-visible:outline-2 focus-visible:outline-[#056455]"
    >
      <option value="en" lang="en">English</option>
      <option value="np" lang="ne">नेपाली</option>
    </select>
  );
}
