// frontend/src/components/common/ImageGenerator.tsx
import React, { useState } from 'react';
import { api } from '../../utils/api';
import { 
  PhotographIcon, 
  LightningBoltIcon,
  CheckCircleIcon,
  ExclamationIcon
} from '@heroicons/react/outline';

interface ImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  defaultPrompt?: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onImageGenerated,
  defaultPrompt = ''
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [style, setStyle] = useState('photographic');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [estimatedCredits, setEstimatedCredits] = useState(50); // Default for 1 image

  // Styles available for image generation
  const styles = [
    { value: 'photographic', label: 'Photographic' },
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'sketch', label: 'Sketch' },
    { value: 'abstract', label: 'Abstract' }
  ];

  // Get estimated credits
  const updateEstimatedCredits = (numImages: number) => {
    setEstimatedCredits(numImages * 50); // 50 credits per image
  };

  // Handle number of images change
  const handleNumberOfImagesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setNumberOfImages(value);
    updateEstimatedCredits(value);
  };

  // Generate images
  const handleGenerateImages = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for image generation');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const response = await api.generateImages({
        prompt,
        style,
        numberOfImages
      });

      setGeneratedImages(response.data.data.images);
    } catch (error: any) {
      console.error('Error generating images:', error);
      setError(error.response?.data?.error || 'Failed to generate images');
    } finally {
      setGenerating(false);
    }
  };

  // Select image
  const handleSelectImage = (imageUrl: string) => {
    onImageGenerated(imageUrl);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-indigo-600 px-4 py-3 text-white">
        <h3 className="text-lg font-medium flex items-center">
          <PhotographIcon className="h-5 w-5 mr-2" />
          AI Image Generator
        </h3>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
              Image Description
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="style" className="block text-sm font-medium text-gray-700">
                Style
              </label>
              <select
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {styles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="numberOfImages" className="block text-sm font-medium text-gray-700">
                Number of Images
              </label>
              <select
                id="numberOfImages"
                value={numberOfImages}
                onChange={handleNumberOfImagesChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Estimated Credits:</span>
              <span className="text-sm font-medium">{estimatedCredits}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateImages}
            disabled={generating || !prompt.trim()}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <LightningBoltIcon className="h-5 w-5 mr-2" />
                Generate Images
              </>
            )}
          </button>
        </div>

        {generatedImages.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Images</h4>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative border rounded-md overflow-hidden cursor-pointer group"
                  onClick={() => handleSelectImage(imageUrl)}
                >
                  <img src={imageUrl} alt={`Generated image ${index + 1}`} className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button className="bg-white rounded-full p-2">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
