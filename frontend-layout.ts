// frontend/src/components/layouts/MainLayout.tsx
import React, { ReactNode } from 'react';
import Head from 'next/head';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'TextBuilder AI',
  description = 'AI-powered content generation platform'
}) => {
  const { user, loading } = useAuth();

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no user, children should handle redirection
  return (
    <div className="flex h-screen bg-gray-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {user && <Sidebar />}

      <div className="flex flex-col flex-1 overflow-hidden">
        {user && <Header />}
        
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

// frontend/src/components/common/Sidebar.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  PencilIcon,
  DocumentTextIcon,
  CogIcon,
  CreditCardIcon,
  SupportIcon,
  MenuIcon,
  XIcon,
} from '@heroicons/react/outline';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'AI Writer', href: '/ai-writer', icon: PencilIcon },
    { name: 'Auto Writer', href: '/auto-writer', icon: DocumentTextIcon },
    { name: 'Long-form Writer', href: '/long-form-writer', icon: DocumentTextIcon },
    { name: 'Templates', href: '/templates', icon: DocumentTextIcon },
    { name: 'Credits', href: '/credits', icon: CreditCardIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
    { name: 'Support', href: '/support', icon: SupportIcon },
  ];

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-20 m-4 lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="flex items-center justify-center w-10 h-10 bg-white rounded-md shadow-md focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <XIcon className="w-6 h-6 text-gray-600" />
          ) : (
            <MenuIcon className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col w-64 bg-dark-blue text-white">
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className="text-2xl font-bold">TextBuilder AI</h1>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm rounded-md ${
                  isActive(item.href)
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(item.href) ? 'text-white' : 'text-gray-400'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-white">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-300">{user?.credits} credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-10 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
          <div className="relative flex flex-col w-64 h-full bg-dark-blue text-white">
            <div className="flex items-center justify-center h-16 border-b border-gray-700">
              <h1 className="text-2xl font-bold">TextBuilder AI</h1>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm rounded-md ${
                      isActive(item.href)
                        ? 'bg-blue-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive(item.href) ? 'text-white' : 'text-gray-400'
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                    <span className="text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-300">{user?.credits} credits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

// frontend/src/components/common/Header.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import {
  BellIcon,
  UserCircleIcon,
  LogoutIcon,
  CogIcon,
  ArrowLeftIcon,
} from '@heroicons/react/outline';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    logout();
  };

  // Function to get the current page title based on the route
  const getPageTitle = () => {
    const path = router.pathname;
    
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/ai-writer') return 'AI Writer';
    if (path === '/auto-writer') return 'Auto Writer';
    if (path === '/long-form-writer') return 'Long-form Writer';
    if (path === '/templates') return 'Templates';
    if (path === '/credits') return 'Credits';
    if (path === '/settings') return 'Settings';
    if (path === '/support') return 'Support';
    
    return 'TextBuilder AI';
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          {/* Back button - show only on inner pages */}
          {router.pathname !== '/dashboard' && (
            <button
              onClick={() => router.back()}
              className="p-1 mr-4 text-gray-500 rounded-full hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
          )}
          
          <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Credits count */}
          <div className="hidden md:flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            <span className="text-sm font-medium">{user?.credits} credits</span>
          </div>

          {/* Notifications */}
          <button className="p-1 text-gray-500 rounded-full hover:text-gray-900 hover:bg-gray-100">
            <BellIcon className="w-6 h-6" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={toggleProfileMenu}
              className="flex items-center text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-700 font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="ml-2 hidden md:block">{user?.name}</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <Link href="/settings/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Your Profile
                  </Link>
                  <Link href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <CogIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogoutIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

// frontend/src/components/common/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Skip if still loading
    if (loading) return;
    
    // If no user and not on auth pages, redirect to login
    if (!user && 
        router.pathname !== '/login' && 
        router.pathname !== '/register' && 
        router.pathname !== '/forgot-password') {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show nothing while loading or redirecting
  if (loading || (!user && 
                  router.pathname !== '/login' && 
                  router.pathname !== '/register' && 
                  router.pathname !== '/forgot-password')) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
