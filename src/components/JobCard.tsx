import { useState } from 'react';
import { Job } from '../types/job';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { companyLogos } from '../lib/company-logos';
import { cn } from '../lib/utils';
import { Archive, ExternalLink } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onArchive?: (job: Job) => void;
  onClick?: () => void;
}

export function JobCard({ job, onArchive, onClick }: JobCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(job);
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(job.url, '_blank');
  };

  return (
    <Card 
      className={cn(
        "p-6 hover:shadow-lg transition-shadow duration-200",
        onClick && "cursor-pointer"
      )}
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
              <span>•</span>
              <span>{job.status}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {job.url && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenUrl}
              className="shrink-0"
            >
              <ExternalLink className="h-5 w-5 text-gray-500" />
            </Button>
          )}
          {onArchive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleArchive}
              className="shrink-0"
            >
              <Archive className="h-5 w-5 text-gray-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.keywords?.map((keyword, index) => (
          <Badge key={index} variant="secondary">
            {keyword}
          </Badge>
        ))}
      </div>

      {/* Description */}
      <p className="text-gray-600 line-clamp-2">
        {job.description}
      </p>
    </Card>
  );
}
