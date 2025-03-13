// Frontend component exports
// This file re-exports components from various directories
// to create a cleaner import structure

// Common components
export { default as Header } from './common/Header';
export { default as Sidebar } from './common/Sidebar';
export { default as ProtectedRoute } from './common/ProtectedRoute';
export { default as ImageGenerator } from './common/ImageGenerator';

// Layout components
export { default as MainLayout } from './layouts/MainLayout';

// Dashboard components
export { default as StatsCard } from './dashboard/StatsCard';
export { default as RecentArticles } from './dashboard/RecentArticles';

// AI Writer components
export { default as ModelSelector } from './aiwriter/ModelSelector';
export { default as ArticleForm } from './aiwriter/ArticleForm';
export { default as ArticlePreview } from './aiwriter/ArticlePreview';

// Auto Writer components
export { default as TitleGenerator } from './autowriter/TitleGenerator';
export { default as SelectedTitles } from './autowriter/SelectedTitles';
export { default as ArticleConfig } from './autowriter/ArticleConfig';
export { default as GenerationStatus } from './autowriter/GenerationStatus';

// Article components
export { default as ArticleEditor } from './articles/ArticleEditor';
export { default as PublishModal } from './articles/PublishModal';
export { default as ImageInsertionModal } from './articles/ImageInsertionModal';

// Credit components
export { default as PricingPlans } from './credits/PricingPlans';
export { default as CreditHistory } from './credits/CreditHistory';
export { default as CurrentPlan } from './credits/CurrentPlan';
export { default as PaymentModal } from './credits/PaymentModal';

// Longform components
export { default as RichTextEditor } from './longform/RichTextEditor';
export { default as AiAssistantPanel } from './longform/AiAssistantPanel';
export { default as DocumentMetadata } from './longform/DocumentMetadata';

// Settings components
export { default as WordPressSettings } from './settings/WordPressSettings';
