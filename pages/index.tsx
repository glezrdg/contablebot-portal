import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const firmId = localStorage.getItem("firmId");

    if (firmId) {
      // User is logged in, redirect to dashboard
      router.replace("/dashboard");
    } else {
      // User is not logged in, redirect to login
      router.replace("/login");
    }
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
