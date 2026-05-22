import { Document } from 'mongoose';
import { NotePriority } from '../enum/creditInternalNote.enum';

export interface ICreditInternalNote extends Document {
  creditApplication: string;
  createdBy: string;
  note: string;
  category?: string;
  priority: NotePriority;
  isPrivate: boolean;
  attachments: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IInternalNoteStats {
  totalNotes: number;
  privateNotes: number;
  publicNotes: number;
  priorityBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}
