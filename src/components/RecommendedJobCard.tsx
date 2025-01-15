import { useState, MouseEvent } from 'react';
import { HeartIcon, PlusCircleIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RecommendedJob } from '../types/recommended-job';
import { getCompanyLogo, getTimeAgo } from '../lib/company-logos';
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
  const logo = getCompanyLogo(job.company);

  const handleSave = (e: MouseEvent) => {
    e.stopPropagation();
    onSave(job.id);
  };

  const handleAddToBoard = (e: MouseEvent) => {
    e.stopPropagation();
    onAddToBoard(job);
  };

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        {/* Company Logo and Info */}
        <div className="flex gap-4">
          <div 
            className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: logo.backgroundColor }}
          >
            {!imageError ? (
              <img
                src={logo.url}
                alt={`${job.company} logo`}
                className="w-8 h-8 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-white text-lg font-bold">
                {job.company.charAt(0)}
              </span>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {job.position}
            </h3>
            <div className="flex items-center gap-2 text-gray-600">
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleSave}
            title={isSaved ? "Remove from saved" : "Save job"}
          >
            <HeartIcon 
              className={cn(
                "h-5 w-5 transition-colors",
                isSaved ? "fill-red-500 stroke-red-500" : "stroke-gray-500"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleAddToBoard}
            title="Add to board"
          >
            <PlusCircleIcon className="h-5 w-5 stroke-gray-500" />
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-4">
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
      <p className="mt-4 text-gray-600 line-clamp-2">
        {job.description}
      </p>

      {/* Posted Time */}
      <div className="mt-4 text-sm text-gray-500">
        Posted {getTimeAgo(job.created_at)}
      </div>
    </Card>
  );
}
