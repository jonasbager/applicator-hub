import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { DateValue, Job, getDeadlineStatus } from '../types/job';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { getCompanyLogoUrl } from '../lib/company-logos';
import { Check } from 'lucide-react';

const deadlineColors: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  asap: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-700'
};

const statusColors: Record<string, string> = {
  'Rejected': 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Interview': 'bg-green-100 text-green-700',
  'Submitted': 'bg-purple-100 text-purple-700',
  'Not Started': 'bg-gray-100 text-gray-700'
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
  index: number;
  onClick?: () => void;
}

export function JobCard({ job, index, onClick }: JobCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided) => (
        <Card 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "p-6 hover:shadow-lg transition-shadow duration-200 relative",
            onClick && "cursor-pointer",
            "touch-manipulation" // Add touch handling
          )}
          onClick={onClick}
          style={{
            ...provided.draggableProps.style,
            cursor: 'grab' // Show grab cursor
          }}
        >
      <div className="flex flex-col h-full">
        {/* Header: Logo and Company Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
            {(() => {
              const logoUrl = getCompanyLogoUrl(job);
              return !imageError && logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${job.company} logo`}
                  className="w-full h-full object-contain p-1.5"
                  onError={(e) => {
                    console.error('Logo load error for', job.company, e);
                    setImageError(true);
                  }}
                />
              ) : (
                <span className="text-gray-500 text-sm font-medium">
                  {job.company.charAt(0)}
                </span>
              );
            })()}
          </div>
          <span className="text-gray-600 text-sm font-medium">{job.company}</span>
        </div>

        {/* Job Title */}
        <h3 className="font-medium text-base leading-snug text-gray-900 line-clamp-2 max-h-[40px] overflow-hidden mb-4">
          {job.position}
        </h3>

        {/* Bottom Chips */}
        <div className="mt-auto flex justify-between items-center">
          {job.in_joblog ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
              <Check className="h-3 w-3" />
              In Joblog
            </Badge>
          ) : (
            <div />
          )}
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs",
              job.status === 'Rejected' 
                ? statusColors['Rejected']
                : deadlineColors[getDeadlineStatus(job.deadline || null)]
            )}
          >
            {job.status === 'Rejected' ? 'Rejected' : getDeadlineText(job.deadline || null)}
          </Badge>
        </div>
      </div>
        </Card>
      )}
    </Draggable>
  );
}
