/**
 * ImageSizingFixImplementation.jsx
 * 
 * This file demonstrates how to implement the image sizing fixes
 * for the Content Studio page in BrandForge.
 * 
 * The key changes are:
 * 1. Improved responsive grid layout
 * 2. Better image container structure with proper aspect ratio handling
 * 3. Using object-fit: cover instead of contain to prevent image overflow
 * 4. Adding sizes attribute to optimize image loading based on viewport
 */

import React from 'react';
import NextImage from 'next/image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ImprovedImageGrid Component
 * 
 * This component replaces the existing image grid in the Content Studio page.
 * It provides better responsive behavior and proper image sizing.
 */
export const ImprovedImageGrid = ({ 
  imageUrls, 
  onDownload,
  className = "" 
}) => {
  // Determine grid columns based on number of images
  const gridClass = imageUrls.length > 1 
    ? (imageUrls.length > 2 
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
      : 'grid-cols-1 sm:grid-cols-2') 
    : 'grid-cols-1';

  return (
    <div className={`grid gap-4 ${gridClass} ${className}`}>
      {imageUrls.map((url, index) => (
        <ImageGridItem 
          key={url || index} 
          url={url} 
          index={index}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};

/**
 * ImageGridItem Component
 * 
 * This component handles the display of individual images in the grid.
 * It properly maintains aspect ratio and handles different image types.
 */
const ImageGridItem = ({ url, index, onDownload }) => {
  // Handle different URL formats (data URI or image_url prefix)
  const displayUrl = url && url.startsWith('image_url:') 
    ? url.substring(10) 
    : url;
  
  const isDisplayableImage = url && (url.startsWith('data:') || url.startsWith('image_url:'));
  const isTaskId = url && url.startsWith('task_id:');
  
  return (
    <div className="relative group w-full overflow-hidden border rounded-md bg-muted">
      {isDisplayableImage ? (
        <>
          {/* Wrapper div to maintain aspect ratio */}
          <div className="aspect-square w-full relative">
            <NextImage
              src={displayUrl}
              alt={`Generated brand image ${index + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{objectFit: 'cover', objectPosition: 'center'}}
              data-ai-hint="brand marketing"
              className="transition-opacity duration-300 opacity-100 group-hover:opacity-80"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 z-10 bg-background/70 hover:bg-background"
            onClick={() => onDownload(displayUrl, `generated-image-${index + 1}.png`)}
            title="Download image"
          >
            <Download className="h-4 w-4"/>
          </Button>
        </>
      ) : isTaskId ? (
        // Task ID display (unchanged from original)
        <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground p-2 text-center aspect-square">
          {/* Task ID content remains the same */}
          <p>Freepik image task pending. <br/> Task ID: {url.substring(8).substring(0,8)}...</p>
          {/* Task status check button remains the same */}
        </div>
      ) : (
        // Not available message (unchanged from original)
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground aspect-square">
          Image not available
        </div>
      )}
    </div>
  );
};

/**
 * Usage Example
 * 
 * This shows how to use the ImprovedImageGrid component in your Content Studio page.
 */
const ExampleUsage = () => {
  // Your existing state and handlers
  const [lastSuccessfulGeneratedImageUrls, setLastSuccessfulGeneratedImageUrls] = useState([]);
  
  const handleDownloadImage = (imageUrl, filename = "generated-image.png") => {
    if (imageUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else { 
      window.open(imageUrl, '_blank');
    }
  };
  
  return (
    <div className="content-studio-container">
      {/* Other content */}
      
      {lastSuccessfulGeneratedImageUrls.length > 0 && (
        <Card className="mt-6 mx-4 mb-4 shadow-sm">
          <CardHeader>
            {/* Header content remains the same */}
          </CardHeader>
          <CardContent>
            {/* Replace the original grid with the improved component */}
            <ImprovedImageGrid 
              imageUrls={lastSuccessfulGeneratedImageUrls}
              onDownload={handleDownloadImage}
            />
            
            {/* Rest of the content remains the same */}
          </CardContent>
        </Card>
      )}
      
      {/* Other content */}
    </div>
  );
};

export default ExampleUsage;