# API Integration Patterns

This guide covers best practices for integrating external APIs with TanStack Query in expo-quick-kit.

## Architecture Overview

```
External APIs
    ↓
services/api.ts (API client)
    ↓
features/[feature]/services/repository.ts (Data transformation)
    ↓
features/[feature]/hooks/use-*.ts (TanStack Query)
    ↓
React Components
```

## Setting Up an API Client

### 1. Create Base API Client

Create `services/api-client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';
import { getSecure } from '@/lib/secure-storage';
import { SecureStorageKey } from '@/lib/secure-storage';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(
      async (config) => {
        const tokenResult = await getSecure(SecureStorageKey.AUTH_TOKEN);
        if (tokenResult.success && tokenResult.data) {
          config.headers.Authorization = `Bearer ${tokenResult.data}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle response errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          console.log('Unauthorized - redirect to login');
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // API error response
      return {
        message: error.response.data?.message || 'API error',
        code: error.response.data?.code,
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'No response from server',
        code: 'NO_RESPONSE',
      };
    } else {
      // Error in request setup
      return {
        message: error.message || 'Unknown error',
        code: 'UNKNOWN',
      };
    }
  }

  async get<T>(endpoint: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, data, config);
    return response.data;
  }

  async patch<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(endpoint, data, config);
    return response.data;
  }

  async delete<T>(endpoint: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(endpoint, config);
    return response.data;
  }
}

export const apiClient = new ApiClient(
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com'
);
```

### 2. Environment Configuration

Update `.env.example`:

```
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_TIMEOUT=10000
```

## Feature API Services

### Pattern 1: Simple GET Request

Create `features/posts/services/api.ts`:

```typescript
import { apiClient } from '@/services/api-client';

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostsResponse {
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const postApi = {
  async getPosts(page: number = 1, limit: number = 10): Promise<PostsResponse> {
    return apiClient.get('/posts', {
      params: { page, limit },
    });
  },

  async getPost(id: number): Promise<Post> {
    return apiClient.get(`/posts/${id}`);
  },

  async createPost(data: { title: string; content: string }): Promise<Post> {
    return apiClient.post('/posts', data);
  },

  async updatePost(id: number, data: Partial<Post>): Promise<Post> {
    return apiClient.put(`/posts/${id}`, data);
  },

  async deletePost(id: number): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },
};
```

### Pattern 2: Pagination

Create `features/posts/services/query-keys.ts`:

```typescript
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...postKeys.lists(), { page, limit }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
};
```

Create `features/posts/hooks/use-posts.ts`:

```typescript
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/features/posts/services/api';
import { postKeys } from '@/features/posts/services/query-keys';

// Fixed page-based pagination
export function usePosts(page: number = 1) {
  return useQuery({
    queryKey: postKeys.list(page, 10),
    queryFn: () => postApi.getPosts(page, 10),
  });
}

// Infinite scroll pagination
export function usePostsInfinite() {
  return useInfiniteQuery({
    queryKey: postKeys.lists(),
    queryFn: ({ pageParam = 1 }) => postApi.getPosts(pageParam, 10),
    getNextPageParam: (lastPage, pages) => {
      const { page, total, limit } = lastPage.pagination;
      return page * limit < total ? page + 1 : undefined;
    },
  });
}

// Get single post
export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.getPost(id),
    enabled: !!id,
  });
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

// Update post
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      postApi.updatePost(id, data),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(
        postKeys.detail(updatedPost.id),
        updatedPost
      );
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
```

### Pattern 3: Search and Filtering

Create `features/posts/services/api.ts` with search:

```typescript
export interface SearchParams {
  q?: string;
  category?: string;
  sortBy?: 'date' | 'relevance';
  page?: number;
  limit?: number;
}

export const postApi = {
  async searchPosts(params: SearchParams): Promise<PostsResponse> {
    return apiClient.get('/posts/search', { params });
  },
};
```

Create hook:

```typescript
import { useQuery } from '@tanstack/react-query';
import { postApi, SearchParams } from '@/features/posts/services/api';

export function useSearchPosts(params: SearchParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['posts', 'search', params],
    queryFn: () => postApi.searchPosts(params),
    enabled,
  });
}
```

Usage:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const { data: results } = useSearchPosts(
  { q: searchQuery },
  searchQuery.length > 0
);
```

## Error Handling & Retry Strategy

### Built-in Retry with Exponential Backoff

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Retry up to 3 times
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Component-Level Error Handling

```typescript
import { Alert } from 'react-native';
import { useCreatePost } from '@/features/posts/hooks/use-posts';

export function CreatePostForm() {
  const createMutation = useCreatePost();

  const handleSubmit = (formData: any) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert('Success', 'Post created!');
      },
      onError: (error: any) => {
        // Handle specific error codes
        if (error.status === 409) {
          Alert.alert('Error', 'This post already exists');
        } else if (error.status === 422) {
          Alert.alert('Validation Error', error.message);
        } else {
          Alert.alert('Error', error.message || 'Failed to create post');
        }
      },
    });
  };

  return (
    <View>
      {/* Form */}
      <Button
        onPress={handleSubmit}
        loading={createMutation.isPending}
      >
        Create
      </Button>
      {createMutation.isError && (
        <ThemedText style={{ color: 'red' }}>
          {createMutation.error?.message}
        </ThemedText>
      )}
    </View>
  );
}
```

## Advanced Patterns

### Optimistic Updates

```typescript
const updateMutation = useMutation({
  mutationFn: (data) => postApi.updatePost(data.id, data),
  onMutate: async (newData) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({
      queryKey: postKeys.detail(newData.id),
    });

    // Get previous data
    const previousData = queryClient.getQueryData(
      postKeys.detail(newData.id)
    );

    // Optimistically update
    queryClient.setQueryData(postKeys.detail(newData.id), newData);

    // Return context for rollback
    return { previousData };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousData) {
      queryClient.setQueryData(
        postKeys.detail(variables.id),
        context.previousData
      );
    }
  },
});
```

### Dependent Queries

```typescript
export function useUserWithPosts(userId: number) {
  // Fetch user first
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.getUser(userId),
    enabled: !!userId,
  });

  // Fetch posts only after user is loaded
  const postsQuery = useQuery({
    queryKey: ['posts', 'byUser', userId],
    queryFn: () => postApi.getPostsByUser(userId),
    enabled: !!userQuery.data?.id, // Only run when user is loaded
  });

  return {
    user: userQuery.data,
    posts: postsQuery.data,
    isLoading: userQuery.isLoading || postsQuery.isLoading,
    error: userQuery.error || postsQuery.error,
  };
}
```

### Polling

```typescript
export function useLivePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.getPost(id),
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true, // Continue polling in background
  });
}
```

## Testing API Integration

### Mock API Responses

```typescript
// __tests__/api.test.ts
import { postApi } from '../services/api';

jest.mock('@/services/api-client');

describe('postApi', () => {
  it('fetches posts successfully', async () => {
    const mockPosts = [
      { id: 1, title: 'Post 1', content: 'Content 1' },
    ];

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: mockPosts,
      pagination: { page: 1, limit: 10, total: 1 },
    });

    const result = await postApi.getPosts();
    expect(result.data).toEqual(mockPosts);
  });

  it('handles API errors', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    await expect(postApi.getPosts()).rejects.toThrow('Network error');
  });
});
```

### Mock Queries in Components

```typescript
// __tests__/components.test.tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { usePost } from '../hooks/use-posts';
import { queryClient } from '@/lib/query-client';

describe('usePost', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('returns post data', async () => {
    const mockPost = {
      id: 1,
      title: 'Test Post',
      content: 'Content',
    };

    queryClient.setQueryData(['posts', 'detail', 1], mockPost);

    const { result } = renderHook(() => usePost(1));

    expect(result.current.data).toEqual(mockPost);
  });
});
```

## Best Practices

### 1. Separation of Concerns

```
api.ts       - Network requests, data transformation
query-keys.ts - Query key definitions
hooks.ts     - Data fetching hooks (TanStack Query)
components/  - UI rendering only
```

### 2. Handle Loading & Error States

```typescript
const { data, isLoading, error } = usePost(id);

if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;
return <PostDetail post={data} />;
```

### 3. Request Deduplication

TanStack Query automatically deduplicates requests:

```typescript
// These both make a single request
const query1 = usePost(1);
const query2 = usePost(1); // Reuses query1
```

### 4. Cache Management

```typescript
// Invalidate cache after mutation
const createMutation = useMutation({
  mutationFn: postApi.createPost,
  onSuccess: () => {
    // All posts queries are refetched
    queryClient.invalidateQueries({
      queryKey: postKeys.lists(),
    });
  },
});
```

### 5. Type Safety

```typescript
// Always type API responses
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

const apiCall = async (): Promise<ApiResponse<Post>> => {
  // ...
};
```

## Related Documentation

- [API_CLIENT Configuration](./API_CLIENT.md) - Detailed API client setup
- [DATABASE_OPERATIONS.md](./DATABASE_OPERATIONS.md) - Local database patterns
- [FEATURE_DEVELOPMENT.md](./FEATURE_DEVELOPMENT.md) - Feature structure
