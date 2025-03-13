// frontend/src/pages/settings/index.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/layouts/MainLayout';
import { useRouter } from 'next/router';
import {
  UserCircleIcon,
  KeyIcon,
  CogIcon,
  CreditCardIcon,
  GlobeIcon,
  BellIcon,
} from '@heroicons/react/outline';

const settingsTabs = [
  { name: 'Profile', href: '/settings/profile', icon: UserCircleIcon },
  { name: 'Password', href: '/settings/password', icon: KeyIcon },
  { name: 'WordPress Sites', href: '/settings/wordpress', icon: GlobeIcon },
  { name: 'Credits & Billing', href: '/settings/credits', icon: CreditCardIcon },
  { name: 'Notifications', href: '/settings/notifications', icon: BellIcon },
  { name: 'Preferences', href: '/settings/preferences', icon: CogIcon },
];

const Settings: React.FC = () => {
  const router = useRouter();
  
  return (
    <MainLayout title="Settings | TextBuilder AI">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-gray-600">Manage your account preferences and connections.</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={router.pathname}
              onChange={(e) => router.push(e.target.value)}
            >
              {settingsTabs.map((tab) => (
                <option key={tab.name} value={tab.href}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                {settingsTabs.map((tab) => {
                  const isActive = router.pathname === tab.href;
                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      className={`${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <tab.icon
                        className={`mr-2 h-5 w-5 ${
                          isActive ? 'text-blue-500' : 'text-gray-400'
                        }`}
                      />
                      {tab.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {settingsTabs.map((category) => (
                <Link
                  href={category.href}
                  key={category.name}
                  className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-full bg-blue-50 text-blue-600 mr-4`}
                    >
                      <category.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {category.name === 'Profile'
                          ? 'Manage your personal information and account settings.'
                          : category.name === 'Password'
                          ? 'Update your password and security settings.'
                          : category.name === 'WordPress Sites'
                          ? 'Connect and manage your WordPress sites for automatic posting.'
                          : category.name === 'Credits & Billing'
                          ? 'View your credit balance and manage payment information.'
                          : category.name === 'Notifications'
                          ? 'Configure how and when you want to be notified.'
                          : 'Set your default preferences for content generation.'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;

// frontend/src/pages/settings/profile.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { UserCircleIcon } from '@heroicons/react/solid';
import Link from 'next/link';

const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setSuccess(false);
      setError(null);
      
      const response = await api.updateProfile({ name, email });
      
      // Update local user state
      updateUser(response.data.data);
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Profile Settings | TextBuilder AI">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
          <p className="text-gray-600">Update your personal information and account details.</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 bg-gray-50 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircleIcon className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                  <p className="text-sm text-gray-500">
                    Update your basic account information and preferences.
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Connected Accounts
                </h4>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">WordPress Sites</span>
                    <Link 
                      href="/settings/wordpress" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 px-6 py-8">
              {success && (
                <div className="mb-6 bg-green-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Profile updated successfully!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => {
                          if (user) {
                            setName(user.name);
                            setEmail(user.email);
                          }
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfileSettings;

// frontend/src/pages/settings/wordpress.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { api } from '../../utils/api';
import { GlobeIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/outline';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/solid';

interface WordPressSite {
  _id: string;
  name: string;
  url: string;
  username: string;
}

interface SiteFormData {
  name: string;
  url: string;
  username: string;
  password: string;
}

const WordPressSettings: React.FC = () => {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<WordPressSite | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    url: '',
    username: '',
    password: '',
  });
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch WordPress sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        const response = await api.getWordPressSites();
        setSites(response.data.data);
      } catch (err) {
        console.error('Error fetching WordPress sites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationResult(null);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      username: '',
      password: '',
    });
    setValidationResult(null);
    setError(null);
  };

  // Open edit modal
  const handleEdit = (site: WordPressSite) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      username: site.username,
      password: '', // Password is not returned from API
    });
    setShowAddModal(true);
  };

  // Open add modal
  const handleAdd = () => {
    setEditingSite(null);
    resetForm();
    setShowAddModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingSite) {
        // Update existing site
        const response = await api.updateWordPressSite(editingSite._id, formData);
        setSites((prev) =>
          prev.map((site) => (site._id === editingSite._id ? response.data.data : site))
        );
      } else {
        // Add new site
        const response = await api.addWordPressSite(formData);
        setSites((prev) => [...prev, response.data.data]);
      }

      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving WordPress site:', err);
      setError(err.response?.data?.error || 'Error saving WordPress site');
    }
  };

  // Handle site deletion
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this WordPress site?')) {
      try {
        await api.deleteWordPressSite(id);
        setSites((prev) => prev.filter((site) => site._id !== id));
      } catch (err: any) {
        console.error('Error deleting WordPress site:', err);
        alert(err.response?.data?.error || 'Error deleting WordPress site');
      }
    }
  };

  // Validate WordPress site connection
  const validateSite = async () => {
    if (!formData.url || !formData.username || !formData.password) {
      setValidationResult({
        valid: false,
        message: 'Please enter URL, username, and password',
      });
      return;
    }

    try {
      setValidating(true);
      setValidationResult(null);
      
      const response = await api.validateWordPressSite({
        url: formData.url,
        username: formData.username,
        password: formData.password,
      });
      
      setValidationResult({
        valid: true,
        message: 'Connection successful!',
      });
    } catch (err: any) {
      console.error('Error validating WordPress site:', err);
      setValidationResult({
        valid: false,
        message: err.response?.data?.error || 'Could not connect to WordPress site',
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <MainLayout title="WordPress Settings | TextBuilder AI">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">WordPress Sites</h2>
            <p className="text-gray-600">
              Connect your WordPress sites for automatic article publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Site
          </button>
        </div>

        {/* WordPress sites list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading WordPress sites...</p>
            </div>
          ) : sites.length === 0 ? (
            <div className="p-12 text-center">
              <GlobeIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No WordPress sites</h3>
              <p className="mt-2 text-sm text-gray-500">
                Connect your WordPress sites to automatically publish articles.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add WordPress Site
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {sites.map((site) => (
                  <li key={site._id} className="px-6 py-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{site.name}</h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <GlobeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                          >
                            {site.url}
                          </a>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Username: {site.username}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(site)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(site._id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit WordPress Site Modal */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowAddModal(false)}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingSite ? 'Edit WordPress Site' : 'Add WordPress Site'}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Connect your WordPress site to automatically publish articles.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon
                        className="h-5 w-5 text-red-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Site Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="My WordPress Blog"
                  />
                </div>

                <div>
                  <label
                    htmlFor="url"
                    className="block text-sm font-medium text-gray-700"
                  >
                    WordPress URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    id="url"
                    value={formData.url}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="https://example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the full URL of your WordPress site (e.g., https://myblog.com)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Admin Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {editingSite ? 'New Password (leave blank to keep current)' : 'Admin Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingSite}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {validationResult && (
                  <div
                    className={`mt-4 p-4 rounded-md ${
                      validationResult.valid ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {validationResult.valid ? (
                          <CheckCircleIcon
                            className="h-5 w-5 text-green-400"
                            aria-hidden="true"
                          />
                        ) : (
                          <ExclamationCircleIcon
                            className="h-5 w-5 text-red-400"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="ml-3">
                        <p
                          className={`text-sm font-medium ${
                            validationResult.valid ? 'text-green-800' : 'text-red-800'
                          }`}
                        >
                          {validationResult.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={validateSite}
                    disabled={validating}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {validating ? 'Validating...' : 'Test Connection'}
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editingSite ? 'Update' : 'Add'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default WordPressSettings;
