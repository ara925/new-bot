// frontend/src/components/autowriter/ArticleConfig.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

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
  onCreditEstimate?: (credits: number) => void;
}

const ArticleConfig: React.FC<ArticleConfigProps> = ({ config, onChange, wordPressSites, onCreditEstimate }) => {
  const [imageCreditsEstimate, setImageCreditsEstimate] = useState(0);
  
  // Update image credits estimate when relevant configuration changes
  useEffect(() => {
    if (config.generateImages) {
      // Fetch estimated credits for image generation
      const fetchImageCredits = async () => {
        try {
          const response = await api.getImageEstimate(config.imageCount);
          setImageCreditsEstimate(response.data.data.estimatedCredits);
          
          // Update total credit estimate through callback
          if (onCreditEstimate) {
            calculateTotalEstimatedCredits();
          }
        } catch (error) {
          console.error('Error fetching image credit estimate:', error);
          // Use fallback calculation (50 credits per image)
          setImageCreditsEstimate(config.imageCount * 50);
          
          if (onCreditEstimate) {
            calculateTotalEstimatedCredits();
          }
        }
      };
      
      fetchImageCredits();
    } else {
      setImageCreditsEstimate(0);
      if (onCreditEstimate) {
        calculateTotalEstimatedCredits();
      }
    }
  }, [config.generateImages, config.imageCount]);
  
  // Calculate total estimated credits
  const calculateTotalEstimatedCredits = () => {
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
    let additionalCredits = 0;
    
    if (config.generateImages) {
      additionalCredits += imageCreditsEstimate;
    }
    
    if (config.takeaways) {
      additionalCredits += config.takeaways * 10; // 10 credits per takeaway
    }
    
    if (config.faqItems) {
      additionalCredits += config.faqItems * 20; // 20 credits per FAQ item
    }
    
    // Add a buffer for other processing
    const buffer = baseCredits * 0.1;
    const totalCredits = Math.ceil(baseCredits + additionalCredits + buffer);
    
    if (onCreditEstimate) {
      onCreditEstimate(totalCredits);
    }
  };

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
            
            {/* Display image credits estimation */}
            <div className="col-span-2 bg-blue-50 p-2 rounded-md text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Image credits:</span>
                <span className="font-medium">{imageCreditsEstimate} credits</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {config.imageCount} {config.imageCount === 1 ? 'image' : 'images'} at 50 credits per image
              </p>
            </div>
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
