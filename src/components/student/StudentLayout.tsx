import React, { useState } from "react";
import { StudentSidebar } from "./StudentSidebar";

interface StudentLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased selection:bg-primary/20 selection:text-primary">
      <StudentSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />
      <main className="flex-1 min-w-0 overflow-x-hidden pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
