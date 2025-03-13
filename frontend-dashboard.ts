// frontend/src/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import StatsCard from '../components/dashboard/StatsCard';
import RecentArticles from '../components/dashboard/RecentArticles';
import {
  DocumentTextIcon,
  ClockIcon,
  CreditCardIcon,
  SparklesIcon
} from '@heroicons/react/outline';

interface DashboardStats {
  totalArticles: number;
  articlesThisMonth: number;
  creditsRemaining: number;
  creditsUsed: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    articlesThisMonth: 0,
    creditsRemaining: user?.credits || 0,
    creditsUsed: 0
  });
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent articles
        const articlesRes = await api.getArticles(1, 5);
        setRecentArticles(articlesRes.data.data);
        
        // Get articles count
        const totalArticles = articlesRes.data.pagination.total;
        
        // Get current month articles count
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const monthlyRes = await api.getArticles(1, 1, {
          startDate: startOfMonth,
          endDate: now.toISOString()
        });
        const articlesThisMonth = monthlyRes.data.pagination.total;
        
        // Get credit transactions
        const creditsRes = await api.getCreditTransactions();
        
        // Sum up credit usage
        const creditsUsed = creditsRes.data.data
          .filter((tx: any) => tx.amount < 0)
          .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
        
        setStats({
          totalArticles,
          articlesThisMonth,
          creditsRemaining: user?.credits || 0,
          creditsUsed
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <MainLayout title="Dashboard | TextBuilder AI">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600">Here's an overview of your content creation activities.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Articles"
            value={stats.totalArticles}
            icon={DocumentTextIcon}
            iconColor="bg-blue-100 text-blue-600"
            loading={loading}
          />
          <StatsCard
            title="This Month"
            value={stats.articlesThisMonth}
            icon={ClockIcon}
            iconColor="bg-green-100 text-green-600"
            loading={loading}
          />
          <StatsCard
            title="Credits Available"
            value={stats.creditsRemaining}
            icon={CreditCardIcon}
            iconColor="bg-purple-100 text-purple-600"
            loading={loading}
          />
          <StatsCard
            title="Credits Used"
            value={stats.creditsUsed}
            icon={SparklesIcon}
            iconColor="bg-orange-100 text-orange-600"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Articles</h3>
              <RecentArticles articles={recentArticles} loading={loading} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-4">
                <a href="/ai-writer" className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-center">
                  Create New Article
                </a>
                <a href="/auto-writer" className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md text-center">
                  Bulk Generate Articles
                </a>
                <a href="/templates" className="block w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md text-center">
                  Use Templates
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Subscription Plan</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Current Plan:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium">
                    {user?.subscriptionPlan?.type?.toUpperCase() || 'Free'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Monthly Credits:</span>
                  <span className="font-medium">{user?.subscriptionPlan?.monthlyCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Plan Type:</span>
                  <span className="font-medium">
                    {user?.subscriptionPlan?.isLifetime ? 'Lifetime' : 'Subscription'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

// frontend/src/components/dashboard/StatsCard.tsx
import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  loading = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          {loading ? (
            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-2xl font-semibold text-gray-900">
              {value.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

// frontend/src/components/dashboard/RecentArticles.tsx
import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Article {
  _id: string;
  title: string;
  status: string;
  wordCount: number;
  createdAt: string;
}

interface RecentArticlesProps {
  articles: Article[];
  loading?: boolean;
}

const RecentArticles: React.FC<RecentArticlesProps> = ({ articles, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-50 p-4 rounded-md animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No articles generated yet.</p>
        <Link href="/ai-writer" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          Create your first article
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {articles.map((article) => (
        <div key={article._id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/articles/${article._id}`} className="text-lg font-medium text-blue-600 hover:text-blue-800">
                {article.title}
              </Link>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <span>{format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
                <span className="mx-2">•</span>
                <span>{article.wordCount} words</span>
              </div>
            </div>
            <div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                article.status === 'completed' ? 'bg-green-100 text-green-800' :
                article.status === 'published' ? 'bg-blue-100 text-blue-800' :
                article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentArticles;

// frontend/src/pages/login.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, user, loading, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <>
      <Head>
        <title>Login | TextBuilder AI</title>
        <meta name="description" content="Log in to your TextBuilder AI account" />
      </Head>

      <div className="flex min-h-screen bg-gray-50">
        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                Log in to your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Or{' '}
                <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  create a new account
                </Link>
              </p>
            </div>

            <div className="mt-8">
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                    <div className="ml-auto pl-3">
                      <div className="-mx-1.5 -my-1.5">
                        <button
                          type="button"
                          onClick={clearError}
                          className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                        >
                          <span className="sr-only">Dismiss</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="relative hidden lg:block lg:flex-1">
          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex h-full flex-col items-center justify-center p-12 text-white">
              <h1 className="text-4xl font-bold mb-6">TextBuilder AI</h1>
              <p className="text-xl max-w-lg text-center mb-8">
                Generate high-quality content with AI. Create blog posts, articles, and more in minutes.
              </p>
              <div className="bg-white bg-opacity-10 p-8 rounded-lg">
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <svg className="h-6 w-6 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Generate 100+ articles with one click</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-6 w-6 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI-generated images included</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-6 w-6 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Auto-post to WordPress</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-6 w-6 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Lifetime plans available</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
