// frontend/src/pages/articles/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layouts/MainLayout';
import { api } from '../../utils/api';
import Link from 'next/link';
import { 
  PencilIcon, 
  SaveIcon, 
  TrashIcon, 
  GlobeIcon, 
  ArrowLeftIcon,
  DownloadIcon,
  DocumentDuplicateIcon,
  ExclamationIcon,
  PhotographIcon
} from '@heroicons/react/outline';
import ArticleEditor from '../../components/articles/ArticleEditor';
import PublishModal from '../../components/articles/PublishModal';
import ImageInsertionModal from '../../components/articles/ImageInsertionModal'; // Add this import
import { format } from 'date-fns';

const ArticleDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false); // Add this state

  // Fetch article
  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const response = await api.getArticle(id as string);
      setArticle(response.data.data);
      setEditedContent(response.data.data.content);
    } catch (error) {
      console.error('Error fetching article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  // Save article
  const saveArticle = async () => {
    if (!editedContent.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.updateArticle(id as string, {
        content: editedContent,
        wordCount: editedContent.split(/\s+/).length
      });
      
      // Update local state
      setArticle(prev => ({
        ...prev,
        content: editedContent,
        wordCount: editedContent.split(/\s+/).length
      }));
      
      setSuccessMessage('Article saved successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error saving article:', error);
      setError('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  // Delete article
  const deleteArticle = async () => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        await api.deleteArticle(id as string);
        router.push('/articles');
      } catch (error) {
        console.error('Error deleting article:', error);
        setError('Failed to delete article');
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(article?.content || '')
      .then(() => {
        setSuccessMessage('Copied to clipboard');
        setTimeout(() => setSuccessMessage(null), 3000);
      })
      .catch(() => setError('Failed to copy to clipboard'));
  };

  // Download article
  const downloadArticle = (format: 'markdown' | 'html') => {
    const content = article?.content;
    if (!content) return;

    let fileContent = content;
    let mimeType = 'text/markdown';
    let extension = 'md';

    if (format === 'html') {
      // Simple markdown to HTML conversion
      fileContent = content
        .replace(/# (.*?)\n/g, '<h1>$1</h1>\n')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>\n')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>\n')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>');
      mimeType = 'text/html';
      extension = 'html';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle publish result
  const handlePublishResult = (result: any) => {
    if (result.success) {
      setArticle(prev => ({
        ...prev,
        status: 'published',
        publishedUrl: result.url
      }));
      setSuccessMessage('Article published successfully');
    } else {
      setError('Failed to publish article');
    }
    setShowPublishModal(false);
  };

  // Handle image insertion
  const handleImageInsert = (imageUrl: string, alt: string, position: string) => {
    let imageHtml = '';
    
    // Create image HTML based on position
    switch (position) {
      case 'featured':
        imageHtml = `![${alt}](${imageUrl})\n\n`;
        setEditedContent(imageHtml + editedContent);
        break;
      case 'left':
        imageHtml = `<img src="${imageUrl}" alt="${alt}" style="float: left; margin-right: 20px; margin-bottom: 10px;" />\n\n`;
        setEditedContent(editedContent + '\n\n' + imageHtml);
        break;
      case 'right':
        imageHtml = `<img src="${imageUrl}" alt="${alt}" style="float: right; margin-left: 20px; margin-bottom: 10px;" />\n\n`;
        setEditedContent(editedContent + '\n\n' + imageHtml);
        break;
      case 'center':
        imageHtml = `<div style="text-align: center;"><img src="${imageUrl}" alt="${alt}" /></div>\n\n`;
        setEditedContent(editedContent + '\n\n' + imageHtml);
        break;
      default: // inline
        imageHtml = `![${alt}](${imageUrl})\n\n`;
        setEditedContent(editedContent + '\n\n' + imageHtml);
        break;
    }
    
    // Update article images array
    if (article) {
      const updatedImages = [...(article.images || []), {
        url: imageUrl,
        alt: alt,
        position: position === 'featured' ? 'featured' : 'content'
      }];
      
      setArticle(prev => ({
        ...prev,
        images: updatedImages
      }));
    }
    
    setShowImageModal(false);
    setUnsavedChanges(true);
  };

  if (loading) {
    return (
      <MainLayout title="Loading Article | TextBuilder AI">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!article) {
    return (
      <MainLayout title="Article Not Found | TextBuilder AI">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <ExclamationIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
            <p className="text-gray-600 mb-6">
              The article you are looking for does not exist or has been deleted.
            </p>
            <Link 
              href="/articles"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Back to Articles
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`${article.title} | TextBuilder AI`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <Link 
                href="/articles"
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">{article.title}</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <span className={`mr-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  article.status === 'completed' ? 'bg-green-100 text-green-800' :
                  article.status === 'published' ? 'bg-blue-100 text-blue-800' :
                  article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                </span>
                <span>{format(new Date(article.createdAt), 'MMMM d, yyyy')}</span>
              </div>
              <div>
                <span>{article.wordCount} words</span>
              </div>
              <div>
                <span>Style: {article.config?.style || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {article.publishedUrl && (
              <a
                href={article.publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="View published article"
              >
                <GlobeIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                View Published
              </a>
            )}
            
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Copy to clipboard"
            >
              <DocumentDuplicateIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
              Copy
            </button>
            
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => downloadArticle('markdown')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Download as markdown"
              >
                <DownloadIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Download
              </button>
            </div>
            
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-3 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={saveArticle}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                    Save
                  </>
                )}
              </button>
            )}
            
            {article.status !== 'published' && (
              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                className="inline-flex items-center px-3 py-2 border border-green-600 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <GlobeIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Publish
              </button>
            )}
            
            <button
              type="button"
              onClick={deleteArticle}
              className="inline-flex items-center px-3 py-2 border border-red-600 shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>

        {/* Notification messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
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

        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
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

        {/* Article content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {editing && (
            <div className="px-6 py-2 bg-white border-b border-gray-200">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PhotographIcon className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-500" aria-hidden="true" />
                Insert AI Image
              </button>
            </div>
          )}
          
          {editing ? (
            <ArticleEditor 
              content={editedContent} 
              onChange={setEditedContent} 
            />
          ) : (
            <div className="prose max-w-none p-6 overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} />
            </div>
          )}

          {editing && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditedContent(article.content);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveArticle}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Article metadata */}
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200">
          <div className="px-6 py-5 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Article Metadata</h3>
          </div>
          <div className="px-6 py-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    article.status === 'completed' ? 'bg-green-100 text-green-800' :
                    article.status === 'published' ? 'bg-blue-100 text-blue-800' :
                    article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Word Count</dt>
                <dd className="mt-1 text-sm text-gray-900">{article.wordCount.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{format(new Date(article.createdAt), 'MMMM d, yyyy')}</dd>
              </div>
              {article.updatedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{format(new Date(article.updatedAt), 'MMMM d, yyyy')}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Style</dt>
                <dd className="mt-1 text-sm text-gray-900">{article.config?.style || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Length</dt>
                <dd className="mt-1 text-sm text-gray-900">{article.config?.length || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Language</dt>
                <dd className="mt-1 text-sm text-gray-900">{article.config?.language || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tone</dt>
                <dd className="mt-1 text-sm text-gray-900">{article.config?.tone || 'N/A'}</dd>
              </div>
              {article.publishedUrl && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Published URL</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={article.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-words"
                    >
                      {article.publishedUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal
          article={article}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublishResult}
        />
      )}

      {/* Image Insertion Modal */}
      {showImageModal && (
        <ImageInsertionModal
          onClose={() => setShowImageModal(false)}
          onImageInsert={handleImageInsert}
          articleTitle={article.title}
        />
      )}
    </MainLayout>
  );
};

export default ArticleDetail;
