// frontend/src/pages/templates/index.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import Link from 'next/link';
import { api } from '../../utils/api';
import {
  DocumentTextIcon,
  SearchIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/outline';

// Template categories
const categories = [
  {
    id: 'blog',
    name: 'Blog Posts',
    description: 'Various blog post templates for different niches and formats',
    icon: DocumentTextIcon
  },
  {
    id: 'listicles',
    name: 'Listicles',
    description: 'List-based article templates like "Top 10" and rankings',
    icon: DocumentTextIcon
  },
  {
    id: 'reviews',
    name: 'Reviews',
    description: 'Product and service review templates with structured formats',
    icon: DocumentTextIcon
  },
  {
    id: 'guides',
    name: 'Guides & Tutorials',
    description: 'Step-by-step guides and how-to tutorials for various topics',
    icon: DocumentTextIcon
  },
  {
    id: 'seo',
    name: 'SEO Content',
    description: 'Templates optimized for search engine rankings',
    icon: DocumentTextIcon
  },
  {
    id: 'email',
    name: 'Email Templates',
    description: 'Marketing emails, newsletters, and outreach templates',
    icon: DocumentTextIcon
  }
];

// Mock template data
const templates = [
  {
    id: 'how-to-guide',
    title: 'How-To Guide',
    description: 'Step-by-step instructions for completing a specific task',
    category: 'guides',
    popular: true
  },
  {
    id: 'product-review',
    title: 'Product Review',
    description: 'Comprehensive review of a product with pros, cons, and rating',
    category: 'reviews',
    popular: true
  },
  {
    id: 'listicle-top-10',
    title: 'Top 10 List',
    description: 'Top 10 items in a category with descriptions and comparisons',
    category: 'listicles',
    popular: true
  },
  {
    id: 'blog-informational',
    title: 'Informational Blog Post',
    description: 'Educational content that answers questions and provides value',
    category: 'blog',
    popular: true
  },
  {
    id: 'seo-pillar-content',
    title: 'SEO Pillar Content',
    description: 'In-depth, comprehensive content that covers a topic thoroughly',
    category: 'seo',
    popular: false
  },
  {
    id: 'email-newsletter',
    title: 'Email Newsletter',
    description: 'Regular email update with valuable content for subscribers',
    category: 'email',
    popular: false
  },
  {
    id: 'comparison-post',
    title: 'Comparison Post',
    description: 'Compare two or more products, services, or approaches',
    category: 'blog',
    popular: false
  },
  {
    id: 'case-study',
    title: 'Case Study',
    description: 'Detailed analysis of a specific project, client, or situation',
    category: 'blog',
    popular: false
  },
  {
    id: 'tutorial',
    title: 'Technical Tutorial',
    description: 'Technical instructions with code examples and screenshots',
    category: 'guides',
    popular: false
  },
  {
    id: 'buyers-guide',
    title: 'Buyer\'s Guide',
    description: 'Comprehensive guide to help readers make purchase decisions',
    category: 'guides',
    popular: false
  },
  {
    id: 'listicle-best-of',
    title: 'Best of [Year/Category]',
    description: 'Roundup of the best items in a category for a specific period',
    category: 'listicles',
    popular: false
  },
  {
    id: 'email-sales',
    title: 'Sales Email Sequence',
    description: 'Series of emails designed to convert prospects into customers',
    category: 'email',
    popular: false
  }
];

const TemplatesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredTemplates, setFilteredTemplates] = useState(templates);

  // Filter templates based on search query and category
  useEffect(() => {
    let filtered = templates;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) || 
        template.description.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  }, [searchQuery, selectedCategory]);

  return (
    <MainLayout title="Templates | TextBuilder AI">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Templates</h2>
          <p className="text-gray-600">
            Jump-start your content creation with professionally designed templates
          </p>
        </div>

        {/* Search and filter */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    !selectedCategory
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Popular templates section */}
        {!selectedCategory && !searchQuery && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates
                .filter(template => template.popular)
                .map(template => (
                  <Link
                    key={template.id}
                    href={`/templates/${template.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    <div className="p-5 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{template.title}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                    <div className="px-5 py-3 bg-gray-50 text-sm text-blue-600 font-medium flex items-center justify-between border-t border-gray-100">
                      Use Template
                      <ArrowRightIcon className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* All templates */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedCategory
              ? `${categories.find(c => c.id === selectedCategory)?.name} Templates`
              : searchQuery
                ? 'Search Results'
                : 'All Templates'}
          </h3>
          
          {filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-lg shadow py-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{template.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {categories.find(cat => cat.id === template.category)?.name}
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 text-sm text-blue-600 font-medium flex items-center justify-between border-t border-gray-100">
                    Use Template
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TemplatesPage;

// frontend/src/pages/templates/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layouts/MainLayout';
import Link from 'next/link';
import { api } from '../../utils/api';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  LightningBoltIcon
} from '@heroicons/react/outline';

// Mock template data - in a real application, this would come from an API
const templateData = {
  'how-to-guide': {
    title: 'How-To Guide',
    description: 'Step-by-step instructions for completing a specific task',
    category: 'guides',
    fields: [
      { name: 'title', label: 'Article Title', type: 'text', placeholder: 'How to [Accomplish Task] in [Timeframe/Easily]', required: true },
      { name: 'introduction', label: 'Introduction', type: 'textarea', placeholder: 'Brief overview of what the reader will learn and why it matters', rows: 3 },
      { name: 'difficultyLevel', label: 'Difficulty Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
      { name: 'timeRequired', label: 'Time Required', type: 'text', placeholder: 'E.g., 30 minutes, 2 hours, etc.' },
      { name: 'materialsNeeded', label: 'Materials/Tools Needed', type: 'textarea', placeholder: 'List any necessary tools, software, or materials', rows: 3 },
      { name: 'steps', label: 'Number of Steps', type: 'number', defaultValue: 5, min: 3, max: 20 },
      { name: 'conclusion', label: 'Conclusion', type: 'textarea', placeholder: 'Summarize what the reader has learned and potential next steps', rows: 3 },
      { name: 'tips', label: 'Additional Tips', type: 'textarea', placeholder: 'Optional tips to help readers succeed', rows: 3 }
    ],
    previewContent: `# How to [Accomplish Task] in [Timeframe/Easily]

## Introduction
[Introduction paragraph about what this guide will teach and why it's valuable]

**Difficulty Level**: [Beginner/Intermediate/Advanced]
**Time Required**: [Time estimate]
**Materials Needed**:
- [Item 1]
- [Item 2]
- [Item 3]

## Step 1: [First Step Title]
[Detailed explanation of the first step with clear instructions]

## Step 2: [Second Step Title]
[Detailed explanation of the second step with clear instructions]

## Step 3: [Third Step Title]
[Detailed explanation of the third step with clear instructions]

## Step 4: [Fourth Step Title]
[Detailed explanation of the fourth step with clear instructions]

## Step 5: [Fifth Step Title]
[Detailed explanation of the fifth step with clear instructions]

## Conclusion
[Summary of what the reader has learned and how they can apply it]

## Additional Tips
- [Tip 1]
- [Tip 2]
- [Tip 3]

*Now that you've learned how to [accomplish task], you're ready to [next steps or benefits].*`
  },
  'product-review': {
    title: 'Product Review',
    description: 'Comprehensive review of a product with pros, cons, and rating',
    category: 'reviews',
    fields: [
      { name: 'productName', label: 'Product Name', type: 'text', placeholder: 'Full product name and model', required: true },
      { name: 'productType', label: 'Product Type/Category', type: 'text', placeholder: 'E.g., Smartphone, Blender, Software, etc.' },
      { name: 'introduction', label: 'Introduction', type: 'textarea', placeholder: 'Brief overview of the product and why readers should care', rows: 3 },
      { name: 'rating', label: 'Overall Rating', type: 'select', options: ['5/5 (Excellent)', '4/5 (Very Good)', '3/5 (Good)', '2/5 (Fair)', '1/5 (Poor)'] },
      { name: 'prosCount', label: 'Number of Pros', type: 'number', defaultValue: 3, min: 2, max: 10 },
      { name: 'consCount', label: 'Number of Cons', type: 'number', defaultValue: 3, min: 2, max: 10 },
      { name: 'specifications', label: 'Key Specifications', type: 'textarea', placeholder: 'List the most important specifications of the product', rows: 3 },
      { name: 'conclusion', label: 'Conclusion', type: 'textarea', placeholder: 'Summary of your evaluation and recommendations', rows: 3 },
      { name: 'alternatives', label: 'Alternatives to Consider', type: 'textarea', placeholder: 'List 2-3 alternative products readers might consider', rows: 2 }
    ],
    previewContent: `# [Product Name] Review: [Brief Opinion]

## Introduction
[Introduction paragraph introducing the product and what makes it noteworthy]

**Overall Rating**: [Rating]/5

## Key Specifications
- [Specification 1]
- [Specification 2]
- [Specification 3]
- [Specification 4]

## The Good: What I Liked

### Pro 1: [First Pro]
[Detailed explanation of first positive aspect]

### Pro 2: [Second Pro]
[Detailed explanation of second positive aspect]

### Pro 3: [Third Pro]
[Detailed explanation of third positive aspect]

## The Bad: What Could Be Improved

### Con 1: [First Con]
[Detailed explanation of first negative aspect]

### Con 2: [Second Con]
[Detailed explanation of second negative aspect]

### Con 3: [Third Con]
[Detailed explanation of third negative aspect]

## Performance & User Experience
[Detailed discussion of how the product performs in real-world usage]

## Value for Money
[Assessment of whether the product is worth its price point]

## Conclusion
[Summary of your overall thoughts and who this product is best for]

## Alternatives to Consider
- [Alternative Product 1]: [Brief reason]
- [Alternative Product 2]: [Brief reason]
- [Alternative Product 3]: [Brief reason]

*This review is based on [testing period/experience] with the [Product Name].*`
  },
  'blog-informational': {
    title: 'Informational Blog Post',
    description: 'Educational content that answers questions and provides value',
    category: 'blog',
    fields: [
      { name: 'title', label: 'Blog Post Title', type: 'text', placeholder: 'Clear, engaging title that includes main keyword', required: true },
      { name: 'introduction', label: 'Introduction', type: 'textarea', placeholder: 'Hook readers, introduce the topic, and explain why it matters', rows: 3 },
      { name: 'mainKeyword', label: 'Main Keyword/Phrase', type: 'text', placeholder: 'Primary SEO keyword or phrase' },
      { name: 'secondaryKeywords', label: 'Secondary Keywords', type: 'text', placeholder: 'Comma-separated list of related keywords' },
      { name: 'sectionsCount', label: 'Number of Main Sections', type: 'number', defaultValue: 4, min: 3, max: 8 },
      { name: 'includeStats', label: 'Include Statistics?', type: 'select', options: ['Yes', 'No'] },
      { name: 'includeExamples', label: 'Include Examples?', type: 'select', options: ['Yes', 'No'] },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'Who is the primary audience for this content?' },
      { name: 'conclusion', label: 'Conclusion', type: 'textarea', placeholder: 'Summarize key points and provide next steps or call to action', rows: 3 }
    ],
    previewContent: `# [Blog Post Title]

## Introduction
[Engaging introduction that hooks the reader, introduces the topic, and explains why it matters]

## [First Main Section Heading]
[Detailed information about the first main aspect of your topic]

[If including statistics: Important statistic or data point that supports your content]

[If including examples: Practical example that illustrates this section's concept]

## [Second Main Section Heading]
[Detailed information about the second main aspect of your topic]

[If including statistics: Important statistic or data point that supports your content]

[If including examples: Practical example that illustrates this section's concept]

## [Third Main Section Heading]
[Detailed information about the third main aspect of your topic]

[If including statistics: Important statistic or data point that supports your content]

[If including examples: Practical example that illustrates this section's concept]

## [Fourth Main Section Heading]
[Detailed information about the fourth main aspect of your topic]

[If including statistics: Important statistic or data point that supports your content]

[If including examples: Practical example that illustrates this section's concept]

## Key Takeaways
- [First key point that readers should remember]
- [Second key point that readers should remember]
- [Third key point that readers should remember]

## Conclusion
[Summary of what was covered, the importance of the topic, and recommended next steps for the reader]

## FAQ
**[Common question about the topic]?**
[Clear answer to the question]

**[Another common question]?**
[Clear answer to the question]

*This article was written for [target audience] who want to [goal related to topic].*`
  }
};

const TemplateDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load template data
  useEffect(() => {
    if (id && typeof id === 'string') {
      if (templateData[id as keyof typeof templateData]) {
        const loadedTemplate = templateData[id as keyof typeof templateData];
        setTemplate(loadedTemplate);
        
        // Initialize form data with default values
        const initialData: Record<string, any> = {};
        loadedTemplate.fields.forEach(field => {
          if (field.defaultValue !== undefined) {
            initialData[field.name] = field.defaultValue;
          } else {
            initialData[field.name] = '';
          }
        });
        setFormData(initialData);
      } else {
        setError('Template not found');
      }
    }
  }, [id]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generate content from template
  const generateContent = () => {
    // Check required fields
    const missingFields = template.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setGenerating(true);
    setError(null);

    // In a real application, this would call an API to generate content
    // For now, we'll just simulate an API call and use the preview content
    setTimeout(() => {
      // Simulate generated content with formData values
      let content = template.previewContent;
      
      // Replace placeholders with form data
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Create a regex that can match field name in brackets
          const regex = new RegExp(`\\[${key.charAt(0).toUpperCase() + key.slice(1)}\\]`, 'gi');
          content = content.replace(regex, value);
        }
      });
      
      setGeneratedContent(content);
      setShowPreview(true);
      setGenerating(false);
    }, 1500);
  };

  // Create new article from template content
  const createArticle = async () => {
    try {
      setGenerating(true);
      
      // Extract title from form data or use template title
      const title = formData.title || formData.productName || `${template.title} - New Article`;
      
      // In a real application, this would call your backend API
      // For now, we'll just redirect to the AI Writer with the content
      router.push({
        pathname: '/ai-writer',
        query: { 
          title,
          content: generatedContent
        }
      });
    } catch (error) {
      console.error('Error creating article:', error);
      setError('Error creating article');
      setGenerating(false);
    }
  };

  if (!template && !error) {
    return (
      <MainLayout title="Loading Template | TextBuilder AI">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !template) {
    return (
      <MainLayout title="Template Not Found | TextBuilder AI">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
            <p className="text-gray-600 mb-6">
              The template you are looking for does not exist.
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Back to Templates
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`${template?.title || 'Template'} | TextBuilder AI`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/templates" className="mr-4 text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{template?.title}</h2>
              <p className="text-gray-600">{template?.description}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Form */}
          <div className={`${showPreview ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Template Parameters</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in the fields to generate content based on this template
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {template?.fields.map((field: any) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        rows={field.rows || 3}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Select an option</option>
                        {field.options.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        min={field.min}
                        max={field.max}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    ) : (
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={generateContent}
                  disabled={generating}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <LightningBoltIcon className="-ml-1 mr-2 h-5 w-5" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className={`${!showPreview ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Content Preview</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Preview how your content will look
                  </p>
                </div>
                {showPreview && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:hidden"
                  >
                    Back to Form
                  </button>
                )}
              </div>
              
              <div className="p-6 flex-1 overflow-auto">
                {!showPreview ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                    <DocumentTextIcon className="h-16 w-16 text-gray-300" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">No content generated yet</p>
                      <p className="mt-1">
                        Fill out the form and click "Generate Content" to preview
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {generatedContent.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={i}>{line.slice(2)}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={i}>{line.slice(3)}</h2>;
                      } else if (line.startsWith('### ')) {
                        return <h3 key={i}>{line.slice(4)}</h3>;
                      } else if (line.startsWith('- ')) {
                        return <li key={i}>{line.slice(2)}</li>;
                      } else if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
                      } else if (line.startsWith('*') && line.endsWith('*')) {
                        return <p key={i}><em>{line.slice(1, -1)}</em></p>;
                      } else if (line.trim() === '') {
                        return <br key={i} />;
                      } else {
                        return <p key={i}>{line}</p>;
                      }
                    })}
                  </div>
                )}
              </div>
              
              {showPreview && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(generatedContent)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentDuplicateIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={createArticle}
                    disabled={generating}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {generating ? 'Creating...' : 'Create Article'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation buttons */}
        <div className="mt-6 lg:hidden">
          {showPreview ? (
            <button
              type="button"
              onClick={createArticle}
              disabled={generating}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {generating ? 'Creating...' : 'Create Article'}
            </button>
          ) : (
            <button
              type="button"
              onClick={generateContent}
              disabled={generating}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <LightningBoltIcon className="-ml-1 mr-2 h-5 w-5" />
                  Generate Content
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TemplateDetailPage;
