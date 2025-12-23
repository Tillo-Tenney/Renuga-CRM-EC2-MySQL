import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showStrengthIndicator?: boolean;
}

/**
 * Enhanced password input component with show/hide toggle
 * Features:
 * - Show/hide password toggle button
 * - Optional password strength indicator
 * - Error and helper text support
 * - Accessible with proper ARIA labels
 * - Premium styling with modern design
 */
export const PasswordInput = ({
  label,
  error,
  helperText,
  showStrengthIndicator = false,
  className,
  ...props
}: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const calculateStrength = (value: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
    let score = 0;

    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^a-zA-Z\d]/.test(value)) score++;

    if (score <= 2) return { strength: 'weak', score };
    if (score <= 4) return { strength: 'medium', score };
    return { strength: 'strong', score };
  };

  const password = props.value as string || '';
  const { strength, score } = showStrengthIndicator ? calculateStrength(password) : { strength: 'weak' as const, score: 0 };

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-slate-200 text-sm font-medium">
          {label}
        </label>
      )}

      <div className="relative group">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        <Input
          type={isVisible ? 'text' : 'password'}
          className={cn(
            'pl-10 pr-10 transition-all duration-200',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsVisible(!isVisible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showStrengthIndicator && password && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-200',
                  i < score ? strengthColors[strength] : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Password strength: <span className={cn('font-semibold', strength === 'strong' ? 'text-green-600' : strength === 'medium' ? 'text-yellow-600' : 'text-red-600')}>{strengthLabels[strength]}</span>
          </p>
        </div>
      )}

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {error && (
        <p className="text-xs text-red-500" id={`${props.id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};
