
"use client";

import React, { useState } from 'react';
import NextImage from 'next/image';
import { ImageIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
  onLoad?: () => void;
  fallbackIcon?: React.ReactNode;
  showErrorMessage?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  unoptimized?: boolean;
  [key: string]: any; // For data attributes and other props
}

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  style,
  onError,
  onLoad,
  fallbackIcon,
  showErrorMessage = false,
  priority,
  sizes,
  quality,
  placeholder,
  blurDataURL,
  unoptimized,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // If there's an error, show fallback
  if (hasError) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-muted text-muted-foreground",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={style}
        {...props}
      >
        {fallbackIcon || <ImageIcon className="w-8 h-8 mb-2" />}
        {showErrorMessage && (
          <div className="text-center px-2">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />
              <span className="text-xs font-medium">Image Unavailable</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This image reference is outdated
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show loading state if needed
  if (isLoading && showErrorMessage) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={style}
        {...props}
      >
        <div className="animate-pulse">
          <ImageIcon className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Render the actual image
  return (
    <NextImage
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      priority={priority}
      sizes={sizes}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      unoptimized={unoptimized}
      {...props}
    />
  );
}

// Specialized version for brand profile images
export function BrandProfileImage(props: Omit<SafeImageProps, 'fallbackIcon' | 'showErrorMessage'>) {
  return (
    <SafeImage
      {...props}
      fallbackIcon={
        <div className="text-center">
          <ImageIcon className="w-8 h-8 mb-2 mx-auto" />
          <p className="text-xs">Brand Image</p>
        </div>
      }
      showErrorMessage={true}
    />
  );
}

// Specialized version for library images
export function LibraryImage(props: Omit<SafeImageProps, 'fallbackIcon' | 'showErrorMessage'>) {
  return (
    <SafeImage
      {...props}
      fallbackIcon={
        <div className="text-center">
          <ImageIcon className="w-8 h-8 mb-2 mx-auto" />
          <p className="text-xs">Library Image</p>
        </div>
      }
      showErrorMessage={true}
    />
  );
}
