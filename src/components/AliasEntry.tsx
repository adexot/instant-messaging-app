import { useState, useEffect } from 'react';
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
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { validateAlias } from '../lib/validation';
import type { AliasFormData } from '../types';

const aliasSchema = z.object({
  alias: z.string()
    .min(2, 'Alias must be at least 2 characters')
    .max(20, 'Alias must be no more than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Alias can only contain letters, numbers, underscores, and hyphens')
    .transform(val => val.trim().toLowerCase()),
});

interface AliasEntryProps {
  onAliasSubmit: (alias: string) => void;
  isLoading?: boolean;
}

export function AliasEntry({ onAliasSubmit, isLoading = false }: AliasEntryProps) {
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
  const [uniquenessError, setUniquenessError] = useState<string | null>(null);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);

  const form = useForm<AliasFormData>({
    resolver: zodResolver(aliasSchema),
    defaultValues: {
      alias: '',
    },
    mode: 'onChange',
  });

  const watchedAlias = form.watch('alias');

  useEffect(() => {
    const checkAliasUniqueness = async (alias: string) => {
      if (!alias || alias.length < 2) {
        setIsUnique(null);
        setUniquenessError(null);
        return;
      }

      const validation = validateAlias(alias);
      if (!validation.isValid) {
        setIsUnique(false);
        setUniquenessError(validation.error || 'Invalid alias format');
        return;
      }

      setIsCheckingUniqueness(true);
      setUniquenessError(null);

      try {
        // For now, simulate the database check since instant-db query method needs to be properly configured
        // In a real implementation, this would query the database
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        
        // Simulate checking for existing users - this would be replaced with actual database query
        const existingUser = false; // Placeholder - would check db.users for matching alias
        
        if (existingUser) {
          setIsUnique(false);
          setUniquenessError('This alias is already taken. Please choose a different one.');
        } else {
          setIsUnique(true);
          setUniquenessError(null);
        }
      } catch (error) {
        console.error('Error checking alias uniqueness:', error);
        setUniquenessError('Unable to verify alias availability. Please try again.');
        setIsUnique(null);
      } finally {
        setIsCheckingUniqueness(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (watchedAlias) {
        checkAliasUniqueness(watchedAlias);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedAlias]);

  const onSubmit = async (data: AliasFormData) => {
    if (!isUnique) {
      return;
    }

    try {
      onAliasSubmit(data.alias);
    } catch (error) {
      console.error('Error submitting alias:', error);
      form.setError('alias', {
        type: 'manual',
        message: 'Failed to join chat. Please try again.',
      });
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

  const isFormValid = form.formState.isValid && isUnique === true && !isCheckingUniqueness;

  return (
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
                    <p className="text-sm text-destructive">{uniquenessError}</p>
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
  );
}