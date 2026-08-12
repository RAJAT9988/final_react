// Types from React Query used below
import { UseMutationOptions, DefaultOptions } from '@tanstack/react-query';

// Default settings for all queries in the app
export const queryConfig = {
  queries: {
    // Do not refetch every time the browser tab is focused
    refetchOnWindowFocus: false,
    // Do not auto-retry failed requests
    retry: false,
    // Treat cached data as fresh for 1 minute
    staleTime: 1000 * 60,
  },
} satisfies DefaultOptions;

// Helper type: get the resolved return type of an async API function
export type ApiFnReturnType<FnType extends (...args: any) => Promise<any>> =
  Awaited<ReturnType<FnType>>;

// Helper type: query options without queryKey/queryFn (those are fixed by hooks)
export type QueryConfig<T extends (...args: any[]) => any> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>;

// Helper type: mutation options typed from an API function
export type MutationConfig<
  MutationFnType extends (...args: any) => Promise<any>,
> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  Error,
  Parameters<MutationFnType>[0]
>;
