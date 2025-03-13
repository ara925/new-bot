// frontend/src/components/articles/ImageInsertionModal.tsx
import React, { useState } from 'react';
import { XIcon } from '@heroicons/react/outline';
import ImageGenerator from '../common/ImageGenerator';

interface ImageInsertionModalProps {
  onClose: () => void;
  onImageInsert: (imageUrl: string, alt: string, position: string) => void;
  articleTitle?: string;
}

const ImageInsertionModal: React.FC<ImageInsertionModalProps> = ({
  onClose,
  onImageInsert,
  articleTitle = ''
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [position, setPosition] = useState('inline');
  const [generatorPrompt, setGeneratorPrompt] = useState(articleTitle);

  // Handle image selected from generator
  const handleImageSelected = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    
    // Set default alt text based on prompt if not already set
    if (!altText && generatorPrompt) {
      setAltText(generatorPrompt);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      return;
    }
    
    onImageInsert(
      selectedImage,
      altText || 'Generated image',
      position
    );
    
    onClose();
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Insert AI-Generated Image</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Generate and insert an AI image into your article
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ImageGenerator 
              onImageGenerated={handleImageSelected} 
              defaultPrompt={generatorPrompt}
            />
          </div>

          {selectedImage && (
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="alt-text" className="block text-sm font-medium text-gray-700">
                    Alt Text (for accessibility)
                  </label>
                  <input
                    type="text"
                    id="alt-text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Describe the image for screen readers"
                  />
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Image Position
                  </label>
                  <select
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="inline">Inline with Text</option>
                    <option value="featured">Featured Image (Top)</option>
                    <option value="left">Float Left</option>
                    <option value="right">Float Right</option>
                    <option value="center">Centered</option>
                  </select>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Insert Image
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageInsertionModal;
