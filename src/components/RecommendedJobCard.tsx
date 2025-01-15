import { useState } from 'react';
import { HeartIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RecommendedJob } from '../types/recommended-job';
import { getTimeAgo } from '../lib/company-logos';
import { cn } from '../lib/utils';

interface RecommendedJobCardProps {
  job: RecommendedJob;
  isSaved: boolean;
  onSave: (jobId: string) => void;
  onAddToBoard: (job: RecommendedJob) => void;
  onClick: () => void;
}

export function RecommendedJobCard({ 
  job, 
  isSaved, 
  onSave, 
  onAddToBoard,
  onClick 
}: RecommendedJobCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(job.id);
  };

  const handleAddToBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToBoard(job);
  };

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-white"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        {/* Company Logo and Info */}
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
            {!imageError ? (
              <img
                src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}
                alt={`${job.company} logo`}
                className="w-8 h-8 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-gray-500 text-lg font-bold">
                {job.company.charAt(0)}
              </span>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {job.position}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span>{job.company}</span>
              {job.applicants_count && (
                <>
                  <span>•</span>
                  <span>{job.applicants_count} Applicants</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={handleSave}
        >
          <HeartIcon 
            className={cn(
              "h-5 w-5 transition-colors",
              isSaved ? "fill-red-500 stroke-red-500" : "stroke-gray-500"
            )}
          />
        </Button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.level && (
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
            {job.level}
          </Badge>
        )}
        {job.type && (
          <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
            {job.type}
          </Badge>
        )}
        {job.location && (
          <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
            {job.location}
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 line-clamp-2 mb-4">
        {job.description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Posted {getTimeAgo(job.created_at)}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddToBoard}
          className="text-primary hover:text-primary/80"
        >
          Add to Board
        </Button>
      </div>
    </Card>
  );
}
