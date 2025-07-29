import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../@/components/ui/button';
import { Input } from '../../@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '../../@/components/ui/form';
import { Card } from '../../@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { validateAndSanitize, RateLimiter } from '../lib/validation';
import { InlineError } from './ui/error';
import { useToastHelpers } from './ui/toast';
import { ErrorBoundary } from './ErrorBoundary';
import type { AliasFormData } from '../types';

const aliasSchema = z.object({
  alias: z.string()
    .min(2, 'Alias must be at least 2 characters')
    .max(20, 'Alias must be no more than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Alias can only contain letters, numbers, underscores, and hyphens')
    .transform(val => val.trim().toLowerCase()),
});

interface AliasEntryProps {
  onAliasSubmit: (alias: string) => Promise<void>;
  checkAliasUniqueness: (alias: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function AliasEntry({ onAliasSubmit, checkAliasUniqueness, isLoading = false }: AliasEntryProps) {
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
  const [uniquenessError, setUniquenessError] = useState<string | null>(null);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const toast = useToastHelpers();
  const rateLimiterRef = useRef(new RateLimiter(10, 60000)); // 10 attempts per minute

  const form = useForm<AliasFormData>({
    resolver: zodResolver(aliasSchema),
    defaultValues: {
      alias: '',
    },
    mode: 'onChange',
  });

  const watchedAlias = form.watch('alias');

  useEffect(() => {
    const checkUniqueness = async (alias: string) => {
      if (!alias || alias.length < 2) {
        setIsUnique(null);
        setUniquenessError(null);
        setRateLimitError(null);
        return;
      }

      // Validate and sanitize input
      const validation = validateAndSanitize.alias(alias);
      if (!validation.isValid) {
        setIsUnique(false);
        setUniquenessError(validation.error || 'Invalid alias format');
        setRateLimitError(null);
        return;
      }

      // Check rate limiting
      const rateLimiter = rateLimiterRef.current;
      if (!rateLimiter.isAllowed('alias-check')) {
        const remainingTime = Math.ceil(rateLimiter.getRemainingTime('alias-check') / 1000);
        setRateLimitError(`Too many attempts. Please wait ${remainingTime} seconds.`);
        setIsUnique(null);
        setUniquenessError(null);
        return;
      }

      setIsCheckingUniqueness(true);
      setUniquenessError(null);
      setRateLimitError(null);

      try {
        const isUnique = await checkAliasUniqueness(validation.sanitized);

        if (!isUnique) {
          setIsUnique(false);
          setUniquenessError('This alias is already taken. Please choose a different one.');
        } else {
          setIsUnique(true);
          setUniquenessError(null);
        }
      } catch (error) {
        console.error('Error checking alias uniqueness:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setUniquenessError('Unable to verify alias availability. Please try again.');
        setIsUnique(null);
        
        // Show toast for network errors
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          toast.error('Connection Error', 'Please check your internet connection and try again.');
        }
      } finally {
        setIsCheckingUniqueness(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (watchedAlias) {
        checkUniqueness(watchedAlias);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedAlias, checkAliasUniqueness, toast]);

  const onSubmit = async (data: AliasFormData) => {
    if (!isUnique || rateLimitError) {
      return;
    }

    // Final validation and sanitization before submission
    const validation = validateAndSanitize.alias(data.alias);
    if (!validation.isValid) {
      form.setError('alias', {
        type: 'manual',
        message: validation.error || 'Invalid alias format',
      });
      return;
    }

    try {
      await onAliasSubmit(validation.sanitized);
    } catch (error) {
      console.error('Error submitting alias:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      form.setError('alias', {
        type: 'manual',
        message: 'Failed to join chat. Please try again.',
      });
      
      toast.error('Join Failed', errorMessage);
    }
  };

  const getValidationIcon = () => {
    if (isCheckingUniqueness) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (isUnique === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (isUnique === false || uniquenessError) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    return null;
  };

  const isFormValid = form.formState.isValid && isUnique === true && !isCheckingUniqueness && !rateLimitError;

  return (
    <ErrorBoundary
      fallback={
        <Card className="w-full max-w-md mx-auto p-6">
          <InlineError message="Failed to load alias entry form. Please refresh the page." />
        </Card>
      }
    >
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Join Chat</h1>
            <p className="text-muted-foreground">
              Choose a unique alias to start messaging
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="alias"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter your alias"
                          {...field}
                          disabled={isLoading}
                          className="pr-10"
                          autoComplete="off"
                          autoFocus
                          maxLength={20}
                        />
                      </FormControl>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getValidationIcon()}
                      </div>
                    </div>
                    <FormDescription>
                      2-20 characters, letters, numbers, underscores, and hyphens only
                    </FormDescription>
                    <FormMessage />
                    {uniquenessError && (
                      <InlineError message={uniquenessError} />
                    )}
                    {rateLimitError && (
                      <div className="flex items-center space-x-2 text-sm text-warning bg-warning/10 border border-warning/20 rounded-md p-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{rateLimitError}</span>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Chat'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </Card>
    </ErrorBoundary>
  );
}