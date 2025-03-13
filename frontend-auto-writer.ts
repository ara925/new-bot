// frontend/src/pages/auto-writer.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import TitleGenerator from '../components/autowriter/TitleGenerator';
import SelectedTitles from '../components/autowriter/SelectedTitles';
import ArticleConfig from '../components/autowriter/ArticleConfig';
import GenerationStatus from '../components/autowriter/GenerationStatus';
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
  wpPublish: boolean;
  wpSiteId?: string;
  wpSchedule?: string;
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
  wpPublish: false,
  aiModel: 'gpt4'
};

const AutoWriter: React.FC = () => {
  const { user } = useAuth();
  const [titleIdeas, setTitleIdeas] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [config, setConfig] = useState<ArticleConfiguration>(defaultConfig);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [wordPressSites, setWordPressSites] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatingTitles, setGeneratingTitles] = useState(false);

  // Fetch WordPress sites on component mount
  useEffect(() => {
    const fetchWordPressSites = async () => {
      try {
        const response = await api.getWordPressSites();
        setWordPressSites(response.data.data);
      } catch (error) {
        console.error('Error fetching WordPress sites:', error);
      }
    };

    fetchWordPressSites();
  }, []);

  // Poll job status when jobId changes
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollJobStatus = async () => {
      if (!jobId) return;

      try {
        const response = await api.getJobStatus(jobId);
        setJobStatus(response.data.data.job);

        // If job is completed or failed, stop polling
        if (
          response.data.data.job.status === 'completed' ||
          response.data.data.job.status === 'failed'
        ) {
          clearInterval(intervalId);
          setGenerating(false);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(intervalId);
        setGenerating(false);
        setError('Error checking generation status');
      }
    };

    if (jobId) {
      // Poll every 5 seconds
      intervalId = setInterval(pollJobStatus, 5000);
      // Initial poll
      pollJobStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);

  // Handle title generation
  const handleGenerateTitles = async (topic: string) => {
    try {
      setGeneratingTitles(true);
      setError(null);
      
      const response = await api.generateTitles(topic);
      setTitleIdeas(response.data.data.titles);
    } catch (error: any) {
      console.error('Error generating titles:', error);
      setError(error.response?.data?.error || 'Error generating titles');
    } finally {
      setGeneratingTitles(false);
    }
  };

  // Toggle title selection
  const toggleTitleSelection = (title: string) => {
    if (selectedTitles.includes(title)) {
      setSelectedTitles(selectedTitles.filter(t => t !== title));
    } else {
      setSelectedTitles([...selectedTitles, title]);
    }
  };

  // Handle config changes
  const handleConfigChange = (field: keyof ArticleConfiguration, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  // Start article generation
  const handleStartGeneration = async () => {
    if (selectedTitles.length === 0) {
      setError('Please select at least one title');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      
      const response = await api.startBulkGeneration(selectedTitles, config);
      setJobId(response.data.data.jobId);
    } catch (error: any) {
      console.error('Error starting generation:', error);
      setError(error.response?.data?.error || 'Error starting generation');
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
    const totalPerArticle = Math.ceil(baseCredits + buffer);
    
    return totalPerArticle * selectedTitles.length;
  };

  return (
    <MainLayout title="Auto Writer | TextBuilder AI">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Auto Writer</h2>
          <p className="text-gray-600">
            Generate multiple high-quality articles with one click. Just select or create title ideas
            and configure your article preferences.
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

        {/* Show generation status if a job is in progress */}
        {jobStatus && (
          <GenerationStatus 
            jobStatus={jobStatus}
            onClose={() => {
              setJobId(null);
              setJobStatus(null);
            }}
          />
        )}

        {/* Main content area */}
        {!generating && !jobStatus && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Title Generator Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Article Title Ideas</h3>
                <TitleGenerator 
                  onGenerate={handleGenerateTitles} 
                  loading={generatingTitles} 
                />
                
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {titleIdeas.map((title, index) => (
                    <div
                      key={index}
                      className={`p-3 mb-2 rounded-md cursor-pointer border ${
                        selectedTitles.includes(title)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleTitleSelection(title)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          <input
                            type="checkbox"
                            checked={selectedTitles.includes(title)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Titles Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Selected Titles ({selectedTitles.length})
                </h3>
                
                <SelectedTitles 
                  titles={selectedTitles} 
                  onRemove={(title) => toggleTitleSelection(title)}
                />

                {selectedTitles.length > 0 && (
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
                )}
              </div>
            </div>

            {/* Configuration Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Article Configuration</h3>
                
                <ArticleConfig 
                  config={config} 
                  onChange={handleConfigChange}
                  wordPressSites={wordPressSites}
                />

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleStartGeneration}
                    disabled={selectedTitles.length === 0}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    START GENERATION!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AutoWriter;

// frontend/src/components/autowriter/TitleGenerator.tsx
import React, { useState } from 'react';
import { SearchIcon } from '@heroicons/react/outline';

interface TitleGeneratorProps {
  onGenerate: (topic: string) => void;
  loading?: boolean;
}

const TitleGenerator: React.FC<TitleGeneratorProps> = ({ onGenerate, loading = false }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onGenerate(topic.trim());
    }
  };

  const sampleTopics = [
    'Labrador retriever care tips',
    'Healthy breakfast recipes',
    'Home office setup ideas',
    'Gardening for beginners',
    'Fitness workout routines',
  ];

  const handleSampleTopic = (sample: string) => {
    setTopic(sample);
    onGenerate(sample);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex rounded-md shadow-sm">
          <div className="relative flex flex-grow items-stretch focus-within:z-10">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full rounded-none rounded-l-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter topic or niche"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading || !topic.trim()}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </form>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Try these topics:</h4>
        <div className="flex flex-wrap gap-2">
          {sampleTopics.map((sample, index) => (
            <button
              key={index}
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => handleSampleTopic(sample)}
              disabled={loading}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TitleGenerator;

// frontend/src/components/autowriter/SelectedTitles.tsx
import React from 'react';
import { XIcon } from '@heroicons/react/solid';

interface SelectedTitlesProps {
  titles: string[];
  onRemove: (title: string) => void;
}

const SelectedTitles: React.FC<SelectedTitlesProps> = ({ titles, onRemove }) => {
  if (titles.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No titles selected yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Generate and select titles from the left panel to create articles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {titles.map((title, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-sm font-medium text-gray-900 mr-2">{title}</span>
          <button
            type="button"
            onClick={() => onRemove(title)}
            className="text-gray-400 hover:text-red-500 focus:outline-none"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default SelectedTitles;

// frontend/src/components/autowriter/ArticleConfig.tsx
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

// AI models
const AI_MODELS = [
  { value: 'gpt4', label: 'GPT-4o (Best quality)' },
  { value: 'claude', label: 'Claude Sonnet 3.7' },
  { value: 'llama', label: 'Meta LLaMA 3.3 70B' },
];

interface ArticleConfigProps {
  config: any;
  onChange: (field: string, value: any) => void;
  wordPressSites: any[];
}

const ArticleConfig: React.FC<ArticleConfigProps> = ({ config, onChange, wordPressSites }) => {
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
        onChange={(e) => onChange(field, e.target.value)}
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
        onChange={(e) => onChange(field, e.target.value === 'yes')}
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
        onChange={(e) => onChange(field, parseInt(e.target.value))}
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
      {/* AI Model */}
      {renderSelect('AI Model', 'aiModel', AI_MODELS)}
      
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

      {/* WordPress Options */}
      <hr className="my-4" />
      <h4 className="text-sm font-medium text-gray-900 mb-2">WordPress</h4>

      <div className="mb-4">
        {renderToggle('Post to WordPress', 'wpPublish')}

        {config.wpPublish && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select WordPress Site
              </label>
              <select
                value={config.wpSiteId || ''}
                onChange={(e) => onChange('wpSiteId', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a site</option>
                {wordPressSites.map((site) => (
                  <option key={site._id} value={site._id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {wordPressSites.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  No WordPress sites configured.{' '}
                  <a href="/settings/wordpress" className="text-blue-600 hover:text-blue-800">
                    Add a site
                  </a>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publishing Schedule
              </label>
              <select
                value={config.wpSchedule || 'immediate'}
                onChange={(e) => onChange('wpSchedule', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="immediate">Publish Immediately</option>
                <option value="daily">Daily (1 per day)</option>
                <option value="alternate">Alternate Days (1 every 2 days)</option>
                <option value="weekly">Weekly (1 per week)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleConfig;

// frontend/src/components/autowriter/GenerationStatus.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/solid';

interface GenerationStatusProps {
  jobStatus: any;
  onClose: () => void;
}

const GenerationStatus: React.FC<GenerationStatusProps> = ({ jobStatus, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // Calculate estimated time remaining
    if (jobStatus.status === 'running') {
      const timePerTitle = 3 * 60; // 3 minutes per article in seconds
      const totalTime = jobStatus.titles.length * timePerTitle;
      const elapsedTime = Math.floor((Date.now() - new Date(jobStatus.startedAt).getTime()) / 1000);
      const remainingTime = Math.max(0, totalTime - elapsedTime);
      
      const mins = Math.floor(remainingTime / 60);
      const secs = remainingTime % 60;
      
      setTimeRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  }, [jobStatus]);

  const isCompleted = jobStatus.status === 'completed';
  const isFailed = jobStatus.status === 'failed';
  const isRunning = jobStatus.status === 'running';

  return (
    <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Article Generation {isCompleted ? 'Completed' : isFailed ? 'Failed' : 'In Progress'}
        </h3>
        {isCompleted && (
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-100 focus:outline-none"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          {isRunning && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress: {jobStatus.progress}%
                </span>
                {timeRemaining && (
                  <span className="text-sm text-gray-500">
                    Estimated time remaining: {timeRemaining}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${jobStatus.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center text-green-600 mb-4">
              <CheckCircleIcon className="h-6 w-6 mr-2" />
              <span className="font-medium">
                Successfully generated {jobStatus.completedTitles.length} articles!
              </span>
            </div>
          )}

          {isFailed && (
            <div className="flex items-center text-red-600 mb-4">
              <ExclamationCircleIcon className="h-6 w-6 mr-2" />
              <span className="font-medium">Generation failed: {jobStatus.errorMessage}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Job ID:</span>
              <span className="text-sm font-mono">{jobStatus.jobId}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">Started:</span>
              <span className="text-sm">
                {jobStatus.startedAt
                  ? new Date(jobStatus.startedAt).toLocaleString()
                  : 'Not started yet'}
              </span>
            </div>
            {jobStatus.completedAt && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Completed:</span>
                <span className="text-sm">
                  {new Date(jobStatus.completedAt).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">Articles:</span>
              <span className="text-sm">
                {jobStatus.completedTitles.length} / {jobStatus.titles.length}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">Credits Used:</span>
              <span className="text-sm">{jobStatus.actualCredits.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {showDetails && (
          <div className="mt-4 border border-gray-200 rounded-md">
            <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-200">
              Generated Articles
            </div>
            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {jobStatus.completedTitles.map((title: string, index: number) => (
                <li key={index} className="px-4 py-3 text-sm">
                  <span className="font-medium text-gray-900">{title}</span>
                </li>
              ))}
              {jobStatus.completedTitles.length === 0 && (
                <li className="px-4 py-3 text-sm text-gray-500">No articles generated yet</li>
              )}
            </ul>
          </div>
        )}

        {isCompleted && (
          <div className="mt-6 flex justify-end space-x-4">
            <Link href="/articles" className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              View All Articles
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start New Generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationStatus;
