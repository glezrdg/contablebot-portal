import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PrimeReactProvider } from "primereact/api";
import { useRouter } from "next/router";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import { ProcessingProvider } from "@/contexts/ProcessingContext";
import { ClientProvider } from "@/contexts/ClientContext";

// PrimeReact styles
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Only show ProcessingIndicator on authenticated dashboard pages (not public pages)
  const isPublicPage = router.pathname === "/" ||
    router.pathname.startsWith("/login") ||
    router.pathname.startsWith("/register");
  const showProcessingIndicator = !isPublicPage;

  return (
    <PrimeReactProvider>
      <ClientProvider>
        <ProcessingProvider>
          <Component {...pageProps} />
          {showProcessingIndicator && <ProcessingIndicator />}
        </ProcessingProvider>
      </ClientProvider>
    </PrimeReactProvider>
  );
}
