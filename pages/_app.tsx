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

  // Only show ProcessingIndicator on authenticated pages
  const isAuthPage = router.pathname === "/login" || router.pathname === "/";
  const showProcessingIndicator = !isAuthPage;

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
