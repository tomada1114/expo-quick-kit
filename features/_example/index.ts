/**
 * _example Feature Module
 *
 * A reference implementation demonstrating the feature module pattern.
 * This module shows how to structure:
 * - Repository pattern for database operations
 * - TanStack Query integration for async state management
 * - Feature-specific components
 * - Type definitions
 *
 * Usage:
 *   // Import from the feature module
 *   import { useItemList, itemRepository, ItemCard } from '@/features/_example';
 *
 *   // Use in components
 *   const { items, isLoading } = useItemList();
 *   const newItem = await itemRepository.create({ title: 'My Item' });
 */

// Types
export type { CreateItemInput, Item, NewItem, UpdateItemInput } from './types';

// Services
export {
  ItemRepository,
  itemKeys,
  itemRepository,
  type ItemQueryKeys,
} from './services';

// Hooks
export { useItemList } from './hooks';

// Components
export {
  ItemCard,
  ItemList,
  ValidationDemo,
  DateDemo,
  SecureStorageDemo,
  type ItemCardProps,
  type ItemListProps,
  type ValidationDemoProps,
  type DateDemoProps,
  type SecureStorageDemoProps,
} from './components';
