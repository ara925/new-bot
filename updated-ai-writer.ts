// frontend/src/pages/ai-writer.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import ModelSelector from '../components/aiwriter/ModelSelector';
import ArticleForm from '../components/aiwriter/ArticleForm';
import ArticlePreview from '../components/aiwriter/ArticlePreview';
import ImageGenerator from '../components/common/ImageGenerator'; // Import the Image Generator
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
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

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
      
      // Prepare configuration with selected images
      const generationConfig = {
        ...config,
        customImages: selectedImages.length > 0 ? selectedImages : undefined
      };
      
      // Start article generation
      const response = await api.generateSingleArticle(title, generationConfig);
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

  // Handle image generation
  const handleImageGenerated = (imageUrl: string) => {
    setSelectedImages([...selectedImages, imageUrl]);
  };

  // Toggle image generator
  const toggleImageGenerator = () => {
    setShowImageGenerator(!showImageGenerator);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Config */}
          <div className="lg:col-span-1">
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

              {/* Custom Image Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Custom AI Images</h4>
                  <button
                    type="button"
                    onClick={toggleImageGenerator}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {showImageGenerator ? 'Hide Generator' : 'Add Custom Images'}
                  </button>
                </div>
                
                {selectedImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Selected Images ({selectedImages.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Custom image ${index + 1}`}
                            className="h-16 w-16 object-cover rounded border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="h-3 w-3 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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

          {/* Middle column - Image Generator (conditionally shown) */}
          {showImageGenerator && (
            <div className="lg:col-span-1">
              <ImageGenerator
                onImageGenerated={handleImageGenerated}
                defaultPrompt={title}
              />
            </div>
          )}

          {/* Right column - Preview */}
          <div className={showImageGenerator ? "lg:col-span-1" : "lg:col-span-2"}>
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
