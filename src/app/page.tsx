/**
 * Main page component for Archibald's Athenaeum
 * Integrates all components into the Next.js app
 */

"use client";

import { Layout } from "@/components/Layout";
import { useState } from "react";

/**
 * The main page of the application, which hosts the primary layout.
 * It now manages a `settingsVersion` state to force UI updates.
 * @returns The rendered HomePage component
 */
export default function HomePage() {
  const [settingsVersion, setSettingsVersion] = useState(0);

  const handleSettingsSave = () => {
    setSettingsVersion((v) => v + 1);
  };

  return <Layout settingsVersion={settingsVersion} onSettingsSave={handleSettingsSave} />;
}
