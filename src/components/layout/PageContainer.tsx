import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main id="app-main" className="flex-1 scroll-pb-8 overflow-y-auto">
      <div className="mx-auto max-w-2xl lg:max-w-3xl xl:max-w-4xl">{children ?? null}</div>
    </main>
  );
}
