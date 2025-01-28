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
      <div className="relative flex gap-4">
        {job.in_joblog && (
          <div className="absolute left-0 top-0 -translate-y-1/2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
              <Check className="h-3 w-3" />
              In Joblog
            </Badge>
          </div>
        )}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
          {(() => {
            console.log('Company:', job.company);
            console.log('Company URL:', job.company_url);
            console.log('API Key:', import.meta.env.VITE_LOGO_API_KEY);
            const logoUrl = getCompanyLogoUrl(job);
            console.log('Generated Logo URL:', logoUrl);
            return !imageError && logoUrl ? (
              <img
                src={logoUrl}
                alt={`${job.company} logo`}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  console.error('Logo load error for', job.company, e);
                  setImageError(true);
                }}
              />
            ) : (
              <span className="text-gray-500 text-lg font-bold">
                {job.company.charAt(0)}
              </span>
            );
          })()}
        </div>
      
        {/* Deadline chip */}
        <div className="absolute bottom-3 right-3">
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
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {job.position}
          </h3>
          <div className="text-gray-600 text-sm">
            {job.company}
          </div>
        </div>
      </div>
        </Card>
      )}
    </Draggable>
  );
}
