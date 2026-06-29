"use client";

import { Toaster } from "react-hot-toast";

export default function Providers() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#0F0F0F",
          color: "#fff",
          borderRadius: "12px",
          fontSize: "14px",
          padding: "12px 20px",
        },
        success: {
          iconTheme: {
            primary: "#059669",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#DC2626",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}