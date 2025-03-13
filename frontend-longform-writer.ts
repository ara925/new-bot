// frontend/src/pages/long-form-writer.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import RichTextEditor from '../components/longform/RichTextEditor';
import AiAssistantPanel from '../components/longform/AiAssistantPanel';
import DocumentMetadata from '../components/longform/DocumentMetadata';
import { useRouter } from 'next/router';
import { api } from '../utils/api';
import { 
  SaveIcon, 
  DocumentTextIcon,
  LightningBoltIcon,
  CheckIcon,
  ExclamationIcon
} from '@heroicons/react/outline';

const LongFormWriter: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [document, setDocument] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState({
    style: 'article',
    tone: 'informative',
    keywords: '',
    targetAudience: '',
    seoTitle: '',
    seoDescription: ''
  });

  // Load document if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      loadDocument(id as string);
    }
  }, [id]);

  // Load document from API
  const loadDocument = async (documentId: string) => {
    setLoading(true);
    try {
      const response = await api.getArticle(documentId);
      const doc = response.data.data;
      
      setDocument(doc);
      setTitle(doc.title);
      setContent(doc.content);
      
      // Set metadata if available
      if (doc.metadata) {
        setMetadata(doc.metadata);
      }
      
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  // Save document
  const saveDocument = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (id && id !== 'new') {
        // Update existing document
        await api.updateArticle(id as string, {
          title,
          content,
          metadata,
          wordCount: content.split(/\s+/).filter(Boolean).length
        });
        
        setSuccessMessage('Document saved successfully');
      } else {
        // Create new document
        const response = await api.createArticle({
          title,
          content,
          metadata,
          status: 'draft',
          wordCount: content.split(/\s+/).filter(Boolean).length
        });
        
        // Redirect to edit page
        router.replace(`/long-form-writer/${response.data.data._id}`);
        setSuccessMessage('Document created successfully');
      }
      
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving document:', error);
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setUnsavedChanges(true);
    
    // Auto-dismiss success message when changes are made
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  // Handle AI-generated suggestions
  const handleAiSuggestion = (suggestion: string, replaceSelection: boolean = false) => {
    if (replaceSelection) {
      // Here we would ideally replace the selected text
      // Since we don't have direct access to the selection in this component,
      // we'll just append the text for now
      setContent(content + '\n\n' + suggestion);
    } else {
      setContent(content + '\n\n' + suggestion);
    }
    
    setUnsavedChanges(true);
  };

  // Toggle AI panel
  const toggleAiPanel = () => {
    setShowAiPanel(!showAiPanel);
  };

  // Handle metadata changes
  const handleMetadataChange = (field: string, value: string) => {
    setMetadata({ ...metadata, [field]: value });
    setUnsavedChanges(true);
  };

  return (
    <MainLayout title={title || 'New Document | TextBuilder AI'}>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-4">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setUnsavedChanges(true);
                }}
                placeholder="Enter document title"
                className="border-0 focus:ring-0 text-xl font-medium text-gray-900 w-96 placeholder-gray-400"
              />
            </div>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={saveDocument}
                disabled={saving}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                  unsavedChanges 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-gray-100'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
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
                    <SaveIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                    {unsavedChanges ? 'Save' : 'Saved'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={toggleAiPanel}
                className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md shadow-sm ${
                  showAiPanel
                    ? 'border-purple-600 text-purple-700 bg-purple-50 hover:bg-purple-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
              >
                <LightningBoltIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                AI Assistant
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {content ? `${content.split(/\s+/).filter(Boolean).length} words` : '0 words'}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                type="button"
                className="ml-auto pl-3"
                onClick={() => setError(null)}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <button
                type="button"
                className="ml-auto pl-3"
                onClick={() => setSuccessMessage(null)}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor pane */}
          <div className={`flex-1 overflow-auto transition-all duration-300 ${showAiPanel ? 'w-2/3' : 'w-full'}`}>
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading document...</p>
                </div>
              </div>
            ) : (
              <RichTextEditor 
                content={content} 
                onChange={handleContentChange} 
              />
            )}
          </div>

          {/* AI assistant panel */}
          {showAiPanel && (
            <div className="w-1/3 border-l border-gray-200 overflow-auto">
              <AiAssistantPanel
                documentContent={content}
                documentTitle={title}
                onInsert={handleAiSuggestion}
                metadata={metadata}
              />
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <DocumentMetadata
            metadata={metadata}
            onChange={handleMetadataChange}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default LongFormWriter;

// frontend/src/components/longform/RichTextEditor.tsx
import React, { useState, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [localContent, setLocalContent] = useState(content);

  // Update editor content when prop changes
  useEffect(() => {
    if (editorRef.current && content !== localContent) {
      editorRef.current.innerHTML = content;
      setLocalContent(content);
    }
  }, [content]);

  // Handle content change
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setLocalContent(newContent);
      onChange(newContent);
    }
  };

  // Handle formatting commands
  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Formatting toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="underline">U</span>
        </button>
        <span className="border-r border-gray-300 mx-1 h-6 self-center"></span>
        <button
          type="button"
          onClick={() => formatText('formatBlock', '<h1>')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', '<h2>')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', '<h3>')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          H3
        </button>
        <span className="border-r border-gray-300 mx-1 h-6 self-center"></span>
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          1. List
        </button>
        <span className="border-r border-gray-300 mx-1 h-6 self-center"></span>
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) formatText('createLink', url);
          }}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', '<blockquote>')}
          className="px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Quote
        </button>
      </div>

      {/* Editable content area */}
      <div 
        ref={editorRef}
        className="flex-1 p-6 overflow-auto focus:outline-none"
        contentEditable
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={handleInput}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;

// frontend/src/components/longform/AiAssistantPanel.tsx
import React, { useState } from 'react';
import { api } from '../../utils/api';
import { 
  LightningBoltIcon, 
  PlusIcon,
  RefreshIcon,
  DocumentDuplicateIcon,
  ArrowCircleUpIcon
} from '@heroicons/react/outline';

interface AiAssistantPanelProps {
  documentContent: string;
  documentTitle: string;
  metadata: any;
  onInsert: (content: string, replaceSelection?: boolean) => void;
}

interface SuggestionRequest {
  type: string;
  prompt?: string;
  context?: string;
}

interface SuggestionType {
  id: string;
  name: string;
  description: string;
  prompt: string;
  contextRequired?: boolean;
  promptRequired?: boolean;
}

const suggestionTypes: SuggestionType[] = [
  {
    id: 'next-paragraph',
    name: 'Continue Writing',
    description: 'Generate the next paragraph based on current content',
    prompt: 'Continue the text with the next logical paragraph',
    contextRequired: true
  },
  {
    id: 'introduction',
    name: 'Write Introduction',
    description: 'Generate an introduction for your article',
    prompt: 'Write an engaging introduction for an article with this title',
    contextRequired: false
  },
  {
    id: 'conclusion',
    name: 'Write Conclusion',
    description: 'Generate a conclusion based on your content',
    prompt: 'Write a conclusion that summarizes the key points',
    contextRequired: true
  },
  {
    id: 'improve',
    name: 'Improve Selection',
    description: 'Improve the selected text',
    prompt: 'Improve the following text to make it more engaging and professional',
    contextRequired: true
  },
  {
    id: 'outline',
    name: 'Generate Outline',
    description: 'Create an outline for your article',
    prompt: 'Create a detailed outline for an article with this title',
    contextRequired: false
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    description: 'Enter your own prompt for the AI',
    prompt: '',
    promptRequired: true
  }
];

const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  documentContent,
  documentTitle,
  metadata,
  onInsert
}) => {
  const [selectedType, setSelectedType] = useState<string>('next-paragraph');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get the selected suggestion type
  const getSelectedType = () => {
    return suggestionTypes.find(type => type.id === selectedType) || suggestionTypes[0];
  };

  // Generate suggestions from AI
  const generateSuggestions = async () => {
    const type = getSelectedType();
    
    if (type.promptRequired && !customPrompt) {
      setError('Please enter a custom prompt');
      return;
    }
    
    if (type.contextRequired && !documentContent) {
      setError('Your document needs content for this suggestion type');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const requestData: SuggestionRequest = {
        type: selectedType,
        prompt: type.id === 'custom' ? customPrompt : type.prompt,
        context: type.contextRequired ? documentContent : undefined
      };
      
      // In a real implementation, this would call the backend API
      // For now, we'll simulate a response with placeholder text
      // const response = await api.generateAiSuggestion(requestData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate response
      const suggestion = getSampleSuggestion(selectedType, documentTitle);
      setSuggestions([suggestion, ...suggestions.slice(0, 4)]);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Get sample suggestion based on type (for demonstration purposes)
  const getSampleSuggestion = (type: string, title: string): string => {
    switch (type) {
      case 'next-paragraph':
        return 'Moreover, the implementation of these strategies has shown remarkable results across various industries. Companies that have adopted these practices report a 35% increase in customer engagement and a 28% boost in conversion rates. By focusing on user experience and data-driven decision making, businesses can create more impactful marketing campaigns that resonate with their target audience.';
      
      case 'introduction':
        return `In today's rapidly evolving digital landscape, understanding how to effectively leverage content marketing has become more crucial than ever before. ${title || 'This article'} explores the fundamental strategies that successful businesses implement to stand out in a crowded marketplace. From establishing a strong brand voice to utilizing analytics for optimization, we'll cover essential techniques that can transform your content strategy and drive meaningful results.`;
      
      case 'conclusion':
        return 'In conclusion, the power of effective content strategy cannot be overstated in today\'s digital marketplace. By implementing the approaches outlined in this article, businesses of all sizes can create more engaging, valuable content that resonates with their audience and drives measurable results. The key is to remain adaptable, data-driven, and focused on providing genuine value. As content marketing continues to evolve, those who master these fundamentals will maintain a competitive edge and build stronger connections with their customers.';
      
      case 'improve':
        return 'The revolutionary approach transforms conventional marketing strategies by leveraging sophisticated data analytics and behavioral psychology insights. By examining customer interaction patterns and preference indicators, companies can craft hyper-personalized messaging that resonates on a deeper emotional level with their target audience. This methodology has demonstrated remarkable efficacy, with early adopters reporting up to 47% improvement in engagement metrics and a substantial 31% increase in conversion rates across diverse industry verticals.';
      
      case 'outline':
        return `# ${title || 'Article Outline'}\n\n## 1. Introduction\n- Overview of the topic's importance\n- Brief background information\n- Thesis statement\n\n## 2. Current Landscape\n- Analysis of existing practices\n- Key challenges in the industry\n- Recent developments and trends\n\n## 3. Strategic Approaches\n- Framework for implementation\n- Key methodologies\n- Case studies and examples\n\n## 4. Best Practices\n- Implementation guidelines\n- Common pitfalls to avoid\n- Tools and resources\n\n## 5. Measuring Success\n- Key performance indicators\n- Analytics and reporting\n- Continuous improvement process\n\n## 6. Conclusion\n- Summary of key points\n- Future outlook\n- Call to action`;
      
      case 'custom':
        return 'The custom AI-generated content would appear here, addressing your specific prompt with relevant, well-structured information. The AI would analyze your request and create content that matches your style, tone, and requirements while providing valuable insights on your chosen topic.';
      
      default:
        return 'The AI assistant has generated this suggestion based on your content. You can use this text as a starting point and modify it to fit your specific needs. The content is designed to maintain a consistent tone and style with your existing document.';
    }
  };

  // Copy suggestion to clipboard
  const copySuggestion = (suggestion: string) => {
    navigator.clipboard.writeText(suggestion);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-purple-50 p-4 border-b border-purple-100">
        <h3 className="text-lg font-medium text-purple-900 flex items-center">
          <LightningBoltIcon className="h-5 w-5 mr-2 text-purple-600" />
          AI Writing Assistant
        </h3>
        <p className="mt-1 text-sm text-purple-700">
          Get AI-powered suggestions to enhance your content
        </p>
      </div>

      <div className="p-4 bg-white">
        <label htmlFor="suggestion-type" className="block text-sm font-medium text-gray-700 mb-1">
          What would you like the AI to help with?
        </label>
        <select
          id="suggestion-type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
        >
          {suggestionTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        
        <p className="mt-2 text-sm text-gray-500">
          {getSelectedType().description}
        </p>

        {selectedType === 'custom' && (
          <div className="mt-3">
            <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Your Custom Prompt
            </label>
            <textarea
              id="custom-prompt"
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your instructions for the AI..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
        )}
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={generateSuggestions}
          disabled={loading}
          className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <LightningBoltIcon className="-ml-1 mr-2 h-4 w-4" />
              Generate Suggestion
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            <p>No suggestions generated yet.</p>
            <p className="mt-1">Select a suggestion type and click Generate.</p>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white rounded-md shadow p-4 border border-gray-200 relative">
              <div className="prose-sm max-w-none mb-3">
                {suggestion.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => copySuggestion(suggestion)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => onInsert(suggestion)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Insert
                </button>
              </div>
              {index === 0 && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    New
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AiAssistantPanel;

// frontend/src/components/longform/DocumentMetadata.tsx
import React from 'react';
import { TagIcon } from '@heroicons/react/outline';

interface DocumentMetadataProps {
  metadata: {
    style: string;
    tone: string;
    keywords: string;
    targetAudience: string;
    seoTitle: string;
    seoDescription: string;
  };
  onChange: (field: string, value: string) => void;
}

const DocumentMetadata: React.FC<DocumentMetadataProps> = ({ metadata, onChange }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const styles = [
    { value: 'article', label: 'Article' },
    { value: 'blog-post', label: 'Blog Post' },
    { value: 'guide', label: 'Guide' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'review', label: 'Review' },
    { value: 'listicle', label: 'Listicle' }
  ];

  const tones = [
    { value: 'informative', label: 'Informative' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'conversational', label: 'Conversational' }
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm font-medium text-gray-700 flex items-center"
      >
        <TagIcon className="h-4 w-4 mr-1.5 text-gray-500" />
        Document Metadata
        <svg
          className={`ml-2 h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-700">
              Style
            </label>
            <select
              id="style"
              value={metadata.style}
              onChange={(e) => onChange('style', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {styles.map(style => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
              Tone
            </label>
            <select
              id="tone"
              value={metadata.tone}
              onChange={(e) => onChange('tone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {tones.map(tone => (
                <option key={tone.value} value={tone.value}>{tone.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
              Keywords
            </label>
            <input
              type="text"
              id="keywords"
              value={metadata.keywords}
              onChange={(e) => onChange('keywords', e.target.value)}
              placeholder="SEO keywords (comma separated)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
              Target Audience
            </label>
            <input
              type="text"
              id="targetAudience"
              value={metadata.targetAudience}
              onChange={(e) => onChange('targetAudience', e.target.value)}
              placeholder="Who is this content for?"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">
              SEO Title
            </label>
            <input
              type="text"
              id="seoTitle"
              value={metadata.seoTitle}
              onChange={(e) => onChange('seoTitle', e.target.value)}
              placeholder="Title for search engines"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">
              SEO Description
            </label>
            <input
              type="text"
              id="seoDescription"
              value={metadata.seoDescription}
              onChange={(e) => onChange('seoDescription', e.target.value)}
              placeholder="Meta description for search engines"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentMetadata;
