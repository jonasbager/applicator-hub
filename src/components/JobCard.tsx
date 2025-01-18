import React, { useState } from 'react';
import { DateValue, Job, getDeadlineStatus } from '../types/job';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const deadlineColors: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  asap: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-700'
};

function getDeadlineText(deadline: DateValue): string {
  if (!deadline) return 'No deadline';
  if (deadline === 'ASAP') return 'ASAP';
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 2) return 'Due soon';
  return `${diffDays}d left`;
}

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card 
      className={cn(
        "p-6 hover:shadow-lg transition-shadow duration-200 relative",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
          {!imageError ? (
            <img
              src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com?size=80&format=png`}
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
      
      {/* Deadline chip */}
      <div className="absolute bottom-3 right-3">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs",
            deadlineColors[getDeadlineStatus(job.deadline || null)]
          )}
        >
          {getDeadlineText(job.deadline || null)}
        </Badge>
      </div>
        
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {job.position}
          </h3>
          <div className="text-gray-600 text-sm">
            {job.company}
          </div>
        </div>
      </div>
    </Card>
  );
}
