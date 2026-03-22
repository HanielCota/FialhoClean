import { Toaster } from "sonner";

export function ToastContainer() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      visibleToasts={3}
      toastOptions={{
        className:
          "!rounded-xl !border !border-white/10 !bg-[#1e1e1e] !shadow-[0_4px_16px_rgba(0,0,0,0.5)] !text-[14px] !text-[#f2f2f2]",
      }}
    />
  );
}
