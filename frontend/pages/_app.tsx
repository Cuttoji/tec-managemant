import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Sidebar from '../src/components/Sidebar';
import AuthGuard from '../src/components/AuthGuard';

const NO_SIDEBAR = ['/login'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showSidebar = !NO_SIDEBAR.includes(router.pathname);

  return (
    <AuthGuard>
      {showSidebar ? (
        <div className="app-layout">
          <Sidebar />
          <div className="page-wrap">
            <div className="page-content">
              <Component {...pageProps} />
            </div>
          </div>
        </div>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthGuard>
  );
}
