import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { BookmarkPlus, Plus, ExternalLink } from 'lucide-react';
import { JobMatch } from '../types/recommended-job';

interface RecommendedJobCardProps {
  job: JobMatch;
}

export function RecommendedJobCard({ job }: RecommendedJobCardProps) {
  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save job:', job.id);
  };

  const handleAddToBoard = () => {
    // TODO: Implement add to board functionality
    console.log('Add to board:', job.id);
  };

  const handleClick = () => {
    window.open(job.url, '_blank');
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{job.title}</h3>
            <p className="text-gray-600 text-sm mb-1">{job.company}</p>
            <p className="text-gray-500 text-sm">{job.location}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              title="Save job"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAddToBoard}
              title="Add to board"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {job.description}
        </p>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {job.level.map((level) => (
              <span
                key={level}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {level}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Match: {Math.round(job.similarity * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleClick}
            >
              View Job
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
