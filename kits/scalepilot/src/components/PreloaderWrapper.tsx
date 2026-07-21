"use client";

import React, { useState } from "react";
import { Preloader } from "./Preloader";

interface PreloaderWrapperProps {
  children: React.ReactNode;
}

export function PreloaderWrapper({ children }: PreloaderWrapperProps) {
  const [showPreloader, setShowPreloader] = useState<boolean>(true);

  const handleFinish = () => {
    setShowPreloader(false);
  };

  return (
    <>
      {showPreloader && (
        <Preloader onFinish={handleFinish} />
      )}
      {children}
    </>
  );
}
