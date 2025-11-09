"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthContainer } from "@/components/AuthContainer";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const shouldShowAuthContainer =
    pathname === "/auth/sign-in" || pathname === "/auth/sign-up";

  return shouldShowAuthContainer ? <AuthContainer /> : <>{children}</>;
}
