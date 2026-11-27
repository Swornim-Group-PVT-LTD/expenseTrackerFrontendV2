"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./config";

export default function I18nProvider({ children }) {
  useEffect(() => {
    const syncDocumentLanguage = (language) => {
      document.documentElement.lang = language === "np" ? "ne" : "en";
    };

    i18n.on("languageChanged", syncDocumentLanguage);
    syncDocumentLanguage(i18n.language);

    const savedLanguage = localStorage.getItem("lang");
    if (savedLanguage === "np" || savedLanguage === "en") {
      void i18n.changeLanguage(savedLanguage);
    }

    return () => i18n.off("languageChanged", syncDocumentLanguage);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
