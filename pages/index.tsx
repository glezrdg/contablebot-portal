// /pages/index.tsx - Redirect to dashboard or login
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Try to fetch /api/me to check if authenticated
    // If authenticated, redirect to dashboard
    // If not, redirect to login
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <p>Redirigiendo...</p>
    </div>
  );
}
