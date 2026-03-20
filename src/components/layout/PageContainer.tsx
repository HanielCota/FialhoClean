import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main id="app-main" className="flex-1 overflow-y-auto scroll-pb-8">
      <div className="max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">{children}</div>
    </main>
  );
}
