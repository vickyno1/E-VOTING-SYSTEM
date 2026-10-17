import React from 'react';
import { CheckCircle2, Clock, Lock, CheckCheck, AlertCircle } from 'lucide-react';

export const StatusBadge = ({ status, hasVoted }) => {
  if (hasVoted) {
    return (
      <span className="badge badge-voted">
        <CheckCheck size={14} /> Already Voted
      </span>
    );
  }

  switch (status) {
    case 'OPEN':
      return (
        <span className="badge badge-open">
          <CheckCircle2 size={14} /> Open
        </span>
      );
    case 'DRAFT':
      return (
        <span className="badge badge-draft">
          <Clock size={14} /> Draft
        </span>
      );
    case 'SCHEDULED':
      return (
        <span className="badge badge-scheduled">
          <Clock size={14} /> Scheduled
        </span>
      );
    case 'CLOSED':
      return (
        <span className="badge badge-closed">
          <Lock size={14} /> Closed
        </span>
      );
    case 'RESULTS_PUBLISHED':
      return (
        <span className="badge badge-results">
          <CheckCheck size={14} /> Results Published
        </span>
      );
    default:
      return (
        <span className="badge badge-draft">
          <AlertCircle size={14} /> {status || 'Unknown'}
        </span>
      );
  }
};
