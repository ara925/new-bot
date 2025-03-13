// frontend/src/pages/articles/index.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { api } from '../../utils/api';
import Link from 'next/link';
import { 
  SearchIcon, 
  FilterIcon, 
  PencilIcon, 
  TrashIcon, 
  GlobeIcon, 
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/outline';
import { format } from 'date-fns';

interface Article {
  _id: string;
  title: string;
  status: string;
  wordCount: number;
  createdAt: string;
  publishedUrl?: string;
  config: {
    style: string;
    length: string;
    language: string;
  };
}

const ArticlesList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  // Fetch articles with pagination and filters
  const fetchArticles = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.getArticles(page, 10, filters);
      setArticles(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchArticles();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    fetchArticles(1);
  };

  // Handle pagination
  const changePage = (page: number) => {
    fetchArticles(page);
  };

  // Handle article selection
  const toggleArticleSelection = (id: string) => {
    setSelectedArticles(prev => 
      prev.includes(id)
        ? prev.filter(articleId => articleId !== id)
        : [...prev, id]
    );
  };

  // Select all articles
  const toggleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(article => article._id));
    }
  };

  // Delete article
  const deleteArticle = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        await api.deleteArticle(id);
        setArticles(prev => prev.filter(article => article._id !== id));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));
        setSelectedArticles(prev => prev.filter(articleId => articleId !== id));
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('Failed to delete article');
      }
    }
  };

  // Delete selected articles
  const deleteSelectedArticles = async () => {
    if (!selectedArticles.length) return;
    
    if (confirm(`Are you sure you want to delete ${selectedArticles.length} selected articles?`)) {
      try {
        await api.deleteMultipleArticles(selectedArticles);
        fetchArticles(pagination.currentPage);
        setSelectedArticles([]);
        setBulkActionOpen(false);
      } catch (error) {
        console.error('Error deleting articles:', error);
        alert('Failed to delete selected articles');
      }
    }
  };

  return (
    <MainLayout title="Articles | TextBuilder AI">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Articles</h2>
            <p className="text-gray-600">
              Manage all your generated articles in one place.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FilterIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Filters
            </button>
            <Link 
              href="/ai-writer"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5" />
              Create New
            </Link>
          </div>
        </div>

        {/* Filter section */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <form onSubmit={applyFilters}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search title..."
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="published">Published</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    From Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    To Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk actions bar */}
        {selectedArticles.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border rounded-lg shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {selectedArticles.length} articles selected
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkActionOpen(!bulkActionOpen)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Bulk Actions
                  <ChevronLeftIcon 
                    className={`ml-2 h-5 w-5 transition-transform ${bulkActionOpen ? 'transform rotate-90' : ''}`}
                  />
                </button>
                {bulkActionOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        type="button"
                        onClick={deleteSelectedArticles}
                        className="text-red-600 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        role="menuitem"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <PencilIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No articles found</h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.status || filters.startDate || filters.endDate
                  ? 'No articles match your filters.'
                  : 'You haven\'t generated any articles yet.'}
              </p>
              {(filters.search || filters.status || filters.startDate || filters.endDate) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              )}
              {!(filters.search || filters.status || filters.startDate || filters.endDate) && (
                <Link 
                  href="/ai-writer"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Generate Your First Article
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5">
                        <input
                          type="checkbox"
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          checked={selectedArticles.length === articles.length && articles.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Word Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Style
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {articles.map((article) => (
                      <tr key={article._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={selectedArticles.includes(article._id)}
                            onChange={() => toggleArticleSelection(article._id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/articles/${article._id}`}
                            className="text-blue-600 hover:text-blue-900 font-medium truncate max-w-xs inline-block"
                          >
                            {article.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            article.status === 'completed' ? 'bg-green-100 text-green-800' :
                            article.status === 'published' ? 'bg-blue-100 text-blue-800' :
                            article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.wordCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.config?.style || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(article.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <Link 
                              href={`/articles/${article._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            {article.publishedUrl && (
                              <a 
                                href={article.publishedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-900"
                                title="View Published"
                              >
                                <GlobeIcon className="h-5 w-5" />
                              </a>
                            )}
                            <Link 
                              href={`/articles/${article._id}/export`}
                              className="text-gray-600 hover:text-gray-900"
                              title="Download"
                            >
                              <DownloadIcon className="h-5 w-5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteArticle(article._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => changePage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => changePage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.currentPage - 1) * 10 + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.currentPage * 10, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => changePage(pagination.currentPage - 1)}
                          disabled={!pagination.hasPrev}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                          // Only show current page, first, last, and pages around current
                          if (
                            page === 1 ||
                            page === pagination.pages ||
                            (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => changePage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pagination.currentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          }
                          
                          // Show ellipsis for gaps
                          if (
                            (page === 2 && pagination.currentPage > 3) ||
                            (page === pagination.pages - 1 && pagination.currentPage < pagination.pages - 2)
                          ) {
                            return (
                              <span
                                key={page}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <button
                          onClick={() => changePage(pagination.currentPage + 1)}
                          disabled={!pagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ArticlesList;
