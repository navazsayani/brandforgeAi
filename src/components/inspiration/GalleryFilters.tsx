'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllIndustries, getAllTemplates, galleryItems } from '@/lib/inspiration/gallery-data';

interface GalleryFiltersProps {
  selectedFilter: string;
  onChange: (filter: string) => void;
}

export default function GalleryFilters({ selectedFilter, onChange }: GalleryFiltersProps) {
  const logoCount = galleryItems.filter(item => item.type === 'logo').length;
  const imageCount = galleryItems.filter(item => item.type === 'image').length;
  const totalCount = galleryItems.length;

  const quickFilters = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'logo', label: 'Logos', count: logoCount },
    { id: 'image', label: 'Images', count: imageCount },
  ];

  const industries = getAllIndustries();
  const templates = getAllTemplates();

  return (
    <div className="space-y-4 mb-8">
      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map(filter => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(filter.id)}
            className={selectedFilter === filter.id ? 'btn-gradient-primary' : ''}
          >
            {filter.label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {filter.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Industry Filter */}
        <Select
          value={selectedFilter.startsWith('industry:') ? selectedFilter.replace('industry:', '') : undefined}
          onValueChange={(value) => onChange(value ? `industry:${value}` : 'all')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map(industry => (
              <SelectItem key={industry} value={industry} className="capitalize">
                {industry.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Template Filter */}
        <Select
          value={selectedFilter.startsWith('template:') ? selectedFilter.replace('template:', '') : undefined}
          onValueChange={(value) => onChange(value ? `template:${value}` : 'all')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Display */}
      {selectedFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filter:</span>
          <Badge variant="secondary" className="capitalize">
            {selectedFilter.includes(':')
              ? selectedFilter.split(':')[1].replace(/_/g, ' ')
              : selectedFilter
            }
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('all')}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
