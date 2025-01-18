import React, { useState } from 'react';
import { Job } from '../types/job';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card 
      className={cn(
        "p-6 hover:shadow-lg transition-shadow duration-200",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
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
          <div className="text-gray-600 text-sm">
            {job.company}
          </div>
        </div>
      </div>

      <p className="text-gray-600 line-clamp-2 mt-4">
        {job.description}
      </p>
    </Card>
  );
}
