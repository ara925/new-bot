// frontend/src/pages/ai-writer.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import ModelSelector from '../components/aiwriter/ModelSelector';
import ArticleForm from '../components/aiwriter/ArticleForm';
import ArticlePreview from '../components/aiwriter/ArticlePreview';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// Interface for article configuration
interface ArticleConfiguration {
  style: string;
  seoFix: boolean;
  language: string;
  length: string;
  pointOfView: string;
  tone: string;
  boldText: boolean;
  takeaways: number;
  faqItems: number;
  generateImages: boolean;
  imageCount: number;
  imagePlacement: string;
  photoStyle: string;
  externalLinks: boolean;
  linkCount: number;
  linkPlacement: string;
  internalLinks: boolean;
  aiModel: string;
}

// Default configuration
const defaultConfig: ArticleConfiguration = {
  style: 'informative',
  seoFix: true,
  language: 'English',
  length: 'medium',
  pointOfView: 'second',
  tone: 'informative',
  boldText: true,
  takeaways: 5,
  faqItems: 5,
  generateImages: true,
  imageCount: 3,
  imagePlacement: 'random',
  photoStyle: 'photographic',
  externalLinks: true,
  linkCount: 3,
  linkPlacement: 'middle',
  internalLinks: true,
  aiModel: 'gpt4'
};

const AIWriter: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<ArticleConfiguration>(defaultConfig);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Handle model selection
  const handleModelChange = (model: string) => {
    setConfig({ ...config, aiModel: model });
  };

  // Handle config changes
  const handleConfigChange = (field: keyof ArticleConfiguration, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  // Generate article
  const handleGenerateArticle = async () => {
    if (!title) {
      setError('Please enter a title for your article');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setArticle(null);
      
      // Start article generation
      const response = await api.generateSingleArticle(title, config);
      const generationJobId = response.data.data.jobId;
      setJobId(generationJobId);
      
      // Set up polling interval to check job status
      const interval = setInterval(async () => {
        try {
          const statusResponse = await api.getJobStatus(generationJobId);
          const job = statusResponse.data.data.job;
          
          // If job is completed or failed, stop polling
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(interval);
            setPollingInterval(null);
            setGenerating(false);
            
            if (job.status === 'completed' && statusResponse.data.data.articles.length > 0) {
              setArticle(statusResponse.data.data.articles[0]);
            } else if (job.status === 'failed') {
              setError(job.errorMessage || 'Generation failed');
            } else {
              setError('No article was generated');
            }
          }
        } catch (err) {
          console.error('Error checking job status:', err);
        }
      }, 3000);
      
      setPollingInterval(interval);
    } catch (err: any) {
      console.error('Error generating article:', err);
      setError(err.response?.data?.error || 'Error generating article');
      setGenerating(false);
    }
  };

  // Calculate estimated credits
  const calculateEstimatedCredits = (): number => {
    let baseCredits = 0;
    
    // Base credits by length
    switch (config.length) {
      case 'short':
        baseCredits = 800;
        break;
      case 'medium':
        baseCredits = 1500;
        break;
      case 'long':
        baseCredits = 2500;
        break;
      default:
        baseCredits = 1500;
    }
    
    // Add credits for additional features
    if (config.generateImages) {
      baseCredits += config.imageCount * 50; // 50 credits per image
    }
    
    if (config.takeaways) {
      baseCredits += config.takeaways * 10; // 10 credits per takeaway
    }
    
    if (config.faqItems) {
      baseCredits += config.faqItems * 20; // 20 credits per FAQ item
    }
    
    // Add a buffer for other processing
    const buffer = baseCredits * 0.1;
    
    return Math.ceil(baseCredits + buffer);
  };

  return (
    <MainLayout title="AI Writer | TextBuilder AI">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">AI Writer</h2>
          <p className="text-gray-600">
            Create a high-quality article by customizing your content preferences and let AI do the writing.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Config */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Choose your AI Model</h3>
              <ModelSelector selectedModel={config.aiModel} onChange={handleModelChange} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Article Configuration</h3>
              <ArticleForm
                title={title}
                onTitleChange={setTitle}
                config={config}
                onConfigChange={handleConfigChange}
              />

              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Estimated Credits:</span>
                  <span className="text-sm font-medium">{calculateEstimatedCredits().toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">Available Credits:</span>
                  <span className="text-sm font-medium">{user?.credits.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGenerateArticle}
                  disabled={!title || generating}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Article...
                    </div>
                  ) : (
                    'Generate Article'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right column - Preview */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow p-6 h-full">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Article Preview</h3>
              <ArticlePreview 
                article={article} 
                loading={generating} 
                title={title} 
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIWriter;

// frontend/src/components/aiwriter/ModelSelector.tsx
import React from 'react';

const AI_MODELS = [
  {
    id: 'gpt4',
    name: 'GPT-4o',
    description:
      'A very powerful AI model that writes high-quality text. The results are displayed immediately in the text writing field.',
    image: '/images/ai-models/gpt4.png',
  },
  {
    id: 'claude',
    name: 'Claude Sonnet 3.7',
    description:
      'High-quality text with a deeper vocabulary and the possibility to write more detailed text. The results are displayed as new text blocks on the left.',
    image: '/images/ai-models/claude.png',
  },
  {
    id: 'llama',
    name: 'Meta LLaMA 3.3 70B',
    description:
      'Fast and efficient model that provides a good balance between quality and speed. Great for generating first drafts quickly.',
    image: '/images/ai-models/llama.png',
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {AI_MODELS.map((model) => (
        <div
          key={model.id}
          className={`border rounded-lg p-4 cursor-pointer transition duration-150 ${
            selectedModel === model.id
              ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onChange(model.id)}
        >
          <div className="text-center mb-2">
            <div 
              className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: 
                  model.id === 'gpt4' ? '#10a37f' : 
                  model.id === 'claude' ? '#6b46c1' : 
                  '#4267B2'
              }}
            >
              <span className="text-white font-bold">
                {model.id === 'gpt4' ? 'G' : model.id === 'claude' ? 'C' : 'L'}
              </span>
            </div>
            <h4 className="font-medium text-gray-900">{model.name}</h4>
          </div>
          <p className="text-xs text-gray-500 mt-2">{model.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ModelSelector;

// frontend/src/components/aiwriter/ArticleForm.tsx
import React from 'react';

// Article styles
const ARTICLE_STYLES = [
  { value: 'informative', label: 'Informative' },
  { value: 'guide', label: 'Guide' },
  { value: 'how-to', label: 'How-to' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'listicle', label: 'Listicle' },
  { value: 'review', label: 'Review' },
];

// Languages
const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
];

// Article lengths
const LENGTHS = [
  { value: 'short', label: 'Short (800-1000 words)' },
  { value: 'medium', label: 'Medium (1500-2000 words)' },
  { value: 'long', label: 'Long (2500-3000 words)' },
];

// Points of view
const POINTS_OF_VIEW = [
  { value: 'first', label: 'First Person' },
  { value: 'second', label: 'Second Person' },
  { value: 'third', label: 'Third Person' },
];

// Tones
const TONES = [
  { value: 'informative', label: 'Informative' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'scientific', label: 'Scientific' },
];

// Photo styles
const PHOTO_STYLES = [
  { value: 'photographic', label: 'Photographic' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'illustrated', label: 'Illustrated' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'sketch', label: 'Sketch' },
];

// Image placements
const IMAGE_PLACEMENTS = [
  { value: 'random', label: 'Random paragraphs' },
  { value: 'beginning', label: 'At the beginning' },
  { value: 'middle', label: 'In the middle' },
  { value: 'end', label: 'At the end' },
];

// Link placements
const LINK_PLACEMENTS = [
  { value: 'random', label: 'Random paragraphs' },
  { value: 'beginning', label: 'At the beginning' },
  { value: 'middle', label: 'In the middle' },
  { value: 'end', label: 'At the end' },
];

interface ArticleFormProps {
  title: string;
  onTitleChange: (title: string) => void;
  config: any;
  onConfigChange: (field: string, value: any) => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  title,
  onTitleChange,
  config,
  onConfigChange,
}) => {
  // Helper function to create select options
  const renderSelect = (
    label: string,
    field: string,
    options: { value: string; label: string }[],
    className: string = ''
  ) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={config[field]}
        onChange={(e) => onConfigChange(field, e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Helper function to create toggle/switch options
  const renderToggle = (label: string, field: string, className: string = '') => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={config[field] ? 'yes' : 'no'}
        onChange={(e) => onConfigChange(field, e.target.value === 'yes')}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );

  // Helper function to create number input options
  const renderNumberInput = (
    label: string,
    field: string,
    min: number,
    max: number,
    className: string = ''
  ) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={config[field]}
        onChange={(e) => onConfigChange(field, parseInt(e.target.value))}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Article Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Article Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter your article title"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Basic Configuration */}
      <div className="grid grid-cols-2 gap-4">
        {renderSelect('Article Style', 'style', ARTICLE_STYLES)}
        {renderToggle('SEO Optimization', 'seoFix')}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {renderSelect('Language', 'language', LANGUAGES)}
        {renderSelect('Article Length', 'length', LENGTHS)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {renderSelect('Point of View', 'pointOfView', POINTS_OF_VIEW)}
        {renderSelect('Tone', 'tone', TONES)}
      </div>

      {/* Formatting Options */}
      <hr className="my-4" />
      <h4 className="text-sm font-medium text-gray-900 mb-2">Formatting</h4>

      <div className="grid grid-cols-2 gap-4">
        {renderToggle('Add Bold Text', 'boldText')}
        {renderNumberInput('Key Takeaways', 'takeaways', 0, 10)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {renderNumberInput('FAQ Items', 'faqItems', 0, 10)}
      </div>

      {/* Image Options */}
      <hr className="my-4" />
      <h4 className="text-sm font-medium text-gray-900 mb-2">Images</h4>

      <div className="grid grid-cols-2 gap-4">
        {renderToggle('Generate AI Images', 'generateImages')}
        {config.generateImages && (
          <>
            {renderNumberInput('Number of Images', 'imageCount', 1, 5)}
            {renderSelect('Image Placement', 'imagePlacement', IMAGE_PLACEMENTS)}
            {renderSelect('Photo Style', 'photoStyle', PHOTO_STYLES)}
          </>
        )}
      </div>

      {/* Links Options */}
      <hr className="my-4" />
      <h4 className="text-sm font-medium text-gray-900 mb-2">Links</h4>

      <div className="grid grid-cols-2 gap-4">
        {renderToggle('Add External Links', 'externalLinks')}
        {config.externalLinks && (
          <>
            {renderNumberInput('Number of Links', 'linkCount', 1, 5)}
            {renderSelect('Link Placement', 'linkPlacement', LINK_PLACEMENTS)}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {renderToggle('Add Internal Links', 'internalLinks')}
      </div>
    </div>
  );
};

export default ArticleForm;

// frontend/src/components/aiwriter/ArticlePreview.tsx
import React from 'react';
import { DownloadIcon, DocumentDuplicateIcon } from '@heroicons/react/outline';

interface ArticlePreviewProps {
  article: any;
  loading: boolean;
  title: string;
}

const ArticlePreview: React.FC<ArticlePreviewProps> = ({ article, loading, title }) => {
  // Handle copy to clipboard
  const handleCopy = () => {
    if (article) {
      navigator.clipboard.writeText(article.content);
      // Could add a toast notification here
    }
  };

  // Handle download as markdown
  const handleDownload = () => {
    if (article) {
      const blob = new Blob([article.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Generating Article</h3>
        <p className="text-gray-500 text-center max-w-md">
          Our AI is working on creating your article about &quot;{title}&quot;. This may take a few minutes depending on the length and complexity.
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No Article Generated Yet</h3>
        <p className="text-gray-500 max-w-md">
          Enter a title, configure your preferences, and click &quot;Generate Article&quot; to create your content.
        </p>
      </div>
    );
  }

  // Process content to fix line breaks for HTML display
  const processedContent = article.content.replace(/\n/g, '<br />');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-900"
            title="Copy to clipboard"
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-900"
            title="Download as markdown"
          >
            <DownloadIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {article.wordCount} words
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {article.config.style}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {article.config.language}
          </span>
          {article.images && article.images.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {article.images.length} images
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
