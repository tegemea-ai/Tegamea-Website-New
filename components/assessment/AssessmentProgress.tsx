import React from 'react';
import { PROGRESS_LABEL } from '../../assessment/coverage';
import type { ProgressStage } from '../../assessment/types';

const AssessmentProgress: React.FC<{ stage: ProgressStage }> = ({ stage }) => (
  <p className="text-[10px] uppercase tracking-[0.28em] text-brand-gold font-bold">{PROGRESS_LABEL[stage]}</p>
);

export default AssessmentProgress;
