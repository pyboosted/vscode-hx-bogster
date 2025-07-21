// React Demo - Showcasing JSX/TSX with Bogster Theme

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Card, Input, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import type { User, Post, Comment } from '@/types';

interface BlogPostProps {
  post: Post;
  onEdit?: (post: Post) => void;
  isOwner?: boolean;
}

// Memoized component with TypeScript props
export const BlogPost = memo<BlogPostProps>(({ post, onEdit, isOwner = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const { user } = useAuth();

  // Query for comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => fetchComments(post.id),
    enabled: isExpanded
  });

  // Mutation for liking
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    },
    onSuccess: (data) => {
      setLikes(data.likes);
    }
  });

  const handleLike = useCallback(() => {
    if (!user) {
      alert('Please login to like posts');
      return;
    }
    likeMutation.mutate();
  }, [user, likeMutation]);

  return (
    <Card className="p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
          <div className="flex gap-2 text-sm text-gray-600">
            <span>By {post.author.name}</span>
            <span>•</span>
            <time>{new Date(post.createdAt).toLocaleDateString()}</time>
          </div>
        </div>
        {isOwner && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit?.(post)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="prose max-w-none mb-4">
        <p className={!isExpanded ? 'line-clamp-3' : ''}>
          {post.content}
        </p>
        {post.content.length > 200 && (
          <button
            className="text-blue-500 hover:underline mt-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t">
        <Button
          variant={likeMutation.isPending ? 'disabled' : 'outline'}
          size="sm"
          onClick={handleLike}
          disabled={likeMutation.isPending}
        >
          <span className="mr-2">👍</span>
          {likes} {likes === 1 ? 'Like' : 'Likes'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          💬 {comments?.length || 0} Comments
        </Button>

        {post.tags?.map(tag => (
          <Badge key={tag} variant="secondary">
            #{tag}
          </Badge>
        ))}
      </div>

      {isExpanded && comments && (
        <CommentSection 
          comments={comments}
          postId={post.id}
          isLoading={isLoading}
        />
      )}
    </Card>
  );
});

BlogPost.displayName = 'BlogPost';

// Custom hook example
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Form component with validation
export function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="Search posts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-4"
      />
      <svg 
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
    </div>
  );
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}