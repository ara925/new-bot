// frontend/src/components/articles/ArticleEditor.tsx
import React, { useState, useEffect } from 'react';
import { MarkdownPreviewProps } from './MarkdownPreview';

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ content, onChange }) => {
  const [localContent, setLocalContent] = useState(content);
  const [previewMode, setPreviewMode] = useState(false);

  // Update local content when content prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Update parent when local content changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 px-4 py-2 flex border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              !previewMode
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              previewMode
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {previewMode ? (
          <div className="prose max-w-none p-6 overflow-auto">
            <div dangerouslySetInnerHTML={{ __html: localContent.replace(/\n/g, '<br />') }} />
          </div>
        ) : (
          <textarea
            value={localContent}
            onChange={handleChange}
            className="w-full h-full p-6 border-0 focus:ring-0 resize-none"
            placeholder="Start writing your article content here..."
            rows={20}
          />
        )}
      </div>
    </div>
  );
};

export default ArticleEditor;

// frontend/src/components/articles/MarkdownPreview.tsx
export interface MarkdownPreviewProps {
  content: string;
}

// This component is a simple placeholder that would ideally use a proper Markdown renderer
// For a real implementation, you might want to use a library like react-markdown
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  // Simple conversion of line breaks to <br> tags
  const formattedContent = content.replace(/\n/g, '<br />');
  
  return (
    <div className="prose max-w-none p-6 overflow-auto">
      <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
    </div>
  );
};

export default MarkdownPreview;

// frontend/src/components/articles/PublishModal.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { ExclamationIcon } from '@heroicons/react/outline';

interface PublishModalProps {
  article: any;
  onClose: () => void;
  onPublish: (result: any) => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ article, onClose, onPublish }) => {
  const [wordPressSites, setWordPressSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [schedule, setSchedule] = useState('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate minimum date for scheduling (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  // Fetch WordPress sites
  useEffect(() => {
    const fetchWordPressSites = async () => {
      try {
        const response = await api.getWordPressSites();
        setWordPressSites(response.data.data);
        
        // Set first site as default if available
        if (response.data.data.length > 0) {
          setSelectedSiteId(response.data.data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching WordPress sites:', error);
        setError('Failed to load WordPress sites');
      } finally {
        setLoading(false);
      }
    };

    fetchWordPressSites();
  }, []);

  // Handle publish
  const handlePublish = async () => {
    if (!selectedSiteId) {
      setError('Please select a WordPress site');
      return;
    }

    // For scheduled posts, check date
    if (schedule === 'scheduled' && !scheduledDate) {
      setError('Please select a scheduled date');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const publishData = {
        wordpressSiteId: selectedSiteId,
        schedule: schedule === 'immediate' 
          ? null 
          : new Date(scheduledDate).toISOString()
      };

      const response = await api.publishArticle(article._id, publishData);
      
      onPublish({
        success: true,
        url: response.data.data.publishResult.url
      });
    } catch (error: any) {
      console.error('Error publishing article:', error);
      setError(error.response?.data?.error || 'Failed to publish article');
      setPublishing(false);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
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
                Publish Article to WordPress
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Select a WordPress site and publishing options for your article.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationIcon
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

          {loading ? (
            <div className="mt-6 flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : wordPressSites.length === 0 ? (
            <div className="mt-6 text-center py-4">
              <p className="text-sm text-gray-500 mb-4">
                You don't have any WordPress sites configured yet.
              </p>
              <a
                href="/settings/wordpress"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add WordPress Site
              </a>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="wordpress-site"
                  className="block text-sm font-medium text-gray-700"
                >
                  WordPress Site
                </label>
                <select
                  id="wordpress-site"
                  name="wordpress-site"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {wordPressSites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.name} ({site.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="schedule"
                  className="block text-sm font-medium text-gray-700"
                >
                  Publishing Schedule
                </label>
                <select
                  id="schedule"
                  name="schedule"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="immediate">Publish Immediately</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>

              {schedule === 'scheduled' && (
                <div>
                  <label
                    htmlFor="scheduled-date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    id="scheduled-date"
                    name="scheduled-date"
                    min={minDateString}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || wordPressSites.length === 0}
              className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
