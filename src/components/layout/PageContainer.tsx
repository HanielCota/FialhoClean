import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main id="app-main" className="flex-1 scroll-pb-8 overflow-y-auto">
      {children ?? null}
    </main>
  );
}
