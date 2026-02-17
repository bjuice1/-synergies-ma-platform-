import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  error: Error;
  retry?: () => void;
}

export function ErrorMessage({ error, retry }: ErrorMessageProps) {
  return (
    <div className="glass-card border-red-500/20 bg-red-500/5 p-4 rounded-lg">
      <div className="flex items-center gap-2 text-red-400 mb-2">
        <AlertCircle className="w-5 h-5" />
        <p className="font-medium">Failed to load data</p>
      </div>
      <p className="text-sm text-gray-400 mb-3">{error.message}</p>
      {retry && (
        <Button onClick={retry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
