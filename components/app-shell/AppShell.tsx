"use client";

import React, { useState } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileTopBar } from "./MobileTopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { WelcomeModal } from "../onboarding/WelcomeModal";
import { ImportModal } from "../shared/ImportModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row transition-colors duration-200">
      <WelcomeModal />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar onImportClick={() => setIsImportModalOpen(true)} />

      {/* Mobile Top Bar */}
      <MobileTopBar onImportClick={() => setIsImportModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 overflow-y-auto">
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
