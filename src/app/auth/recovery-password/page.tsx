"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiHome, FiMail, FiUnlock, FiKey } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type RecoveryStep = "request" | "reset";

export default function RecoveryPasswordPage() {
  const [step, setStep] = useState<RecoveryStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation('recoveryPassword');

  const isRequestStep = step === "request";

  const resetState = () => {
    setFeedbackKey(null);
    setIsSubmitting(false);
  };

  const handleRequestCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setStep("reset");
      setFeedbackKey("span");
      setIsSubmitting(false);
    }, 800);
  };

  const handleResetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setFeedbackKey("alert");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setFeedbackKey("confirm");
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex justify-end px-6 pt-6">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 w-full items-center justify-center px-4 pb-10">
        <div className="w-full max-w-4xl flex flex-col gap-8 rounded-[32px] border border-border bg-card p-8 shadow-2xl shadow-primary/20 md:flex-row md:items-center md:gap-16 md:p-12">
          <div className="mx-auto flex w-full max-w-xs flex-col items-center justify-center md:w-1/2">
            <div className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl border border-border bg-secondary/40 shadow-md">
              <Image
                src="/logo.jpg"
                alt="EduGraph Logo"
                width={320}
                height={320}
                className="aspect-square h-full w-full object-cover"
                priority
                unoptimized
              />
            </div>
          </div>

          <section className="flex w-full md:w-1/2">
            <div className="mx-auto w-full max-w-md space-y-8">
              <header className="space-y-2 text-center md:text-left">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("title")}</p>
                <h1 className="text-3xl font-semibold">{t("description")}</h1>
                <p className="text-sm text-muted-foreground">
                  {isRequestStep
                    ? t("subtitle")
                    : t("subtitlepassword")}
                </p>
              </header>

              <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                <FiHome className="h-5 w-5 text-primary" />
                <span>
                  {t("email")}
                  <span className="ml-2 font-semibold text-foreground"> {t("support")}</span>
                </span>
              </div>

              <form
                onSubmit={isRequestStep ? handleRequestCode : handleResetPassword}
                className="space-y-4"
              >
                {isRequestStep ? (
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-foreground">{t("emaillabel")}</span>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                      <FiMail className="h-5 w-5 text-primary" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          resetState();
                        }}
                        placeholder={t("emailPlaceholder")}
                        className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none "
                      />
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-medium text-foreground">{t("code")}</span>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                        <FiKey className="h-5 w-5 text-primary" />
                        <input
                          type="text"
                          required
                          value={code}
                          onChange={(event) => {
                            setCode(event.target.value);
                            resetState();
                          }}
                          placeholder={t("codePlaceholder")}
                          className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                        />
                      </div>
                    </label>

                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-medium text-foreground">{t("password")}</span>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                        <FiUnlock className="h-5 w-5 text-primary" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            resetState();
                          }}
                          placeholder={t("passwordPlaceholder")}
                          className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                        />
                      </div>
                    </label>

                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-medium text-foreground">{t("confirmPassword")}</span>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                        <FiUnlock className="h-5 w-5 text-primary" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            resetState();
                          }}
                          placeholder={t("confirmPasswordPlaceholder")}
                          className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                        />
                      </div>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary transition-transform duration-200 hover:scale-[1.02] hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:scale-100 disabled:opacity-70 cursor-pointer"
                >
                  {isRequestStep ? t("submit") : t("button")}
                </button>
              </form>

              {feedbackKey && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {t(feedbackKey)}
                </div>
              )}

              <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setPassword("");
                    setConfirmPassword("");
                    resetState();
                  }}
                  className="inline-flex items-center gap-2 text-left font-medium text-foreground transition-colors hover:text-primary"
                >
                  {t("backbutton")}
                </button>
                <Link
                  href="/auth/login"
                  className="text-left font-medium text-foreground transition-colors hover:text-primary"
                >
                  {t("backToHome")}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
