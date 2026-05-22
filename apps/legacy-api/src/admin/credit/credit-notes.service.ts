import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Credit } from '../../credit/schema/credit.schema';
import { CreditInternalNote } from '../../credit/schema/creditInternalNote.schema';
import { CreditRequest } from '../../credit/schema/creditRequest';
import {
  CreateInternalNoteDto,
  GetInternalNotesQueryDto,
} from '../../credit/dto/creditInternalNote.dto';
import { InternalNoteType } from '../../credit/enum/creditInternalNote.enum';
import { successResponse } from '../../utils/responses';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import { paginationUtil } from '../../utils/pagination';

@Injectable()
export class CreditNotesService {
  constructor(
    @InjectModel(Credit.name) private creditModel: Model<Credit>,
    @InjectModel(CreditRequest.name)
    private creditRequestModel: Model<CreditRequest>,
    @InjectModel(CreditInternalNote.name)
    private creditInternalNoteModel: Model<CreditInternalNote>,
  ) {}

  /**
   * Creates an internal note for a credit application or request.
   * @param targetId - The ID of the credit application or request.
   * @param noteDetails - The details of the note to be created.
   * @param adminUserId - The ID of the admin user creating the note.
   * @returns The created internal note.
   */
  async createInternalNote(
    targetId: string,
    noteDetails: CreateInternalNoteDto,
    adminUserId: string,
  ): Promise<any> {
    const { noteType } = noteDetails;

    if (noteType === InternalNoteType.APPLICATION) {
      const creditApplication = await this.creditModel.findById(targetId);
      if (!creditApplication) {
        throw new ConflictException('Credit application not found');
      }
    } else if (noteType === InternalNoteType.REQUEST) {
      const creditRequest = await this.creditRequestModel.findById(targetId);
      if (!creditRequest) {
        throw new ConflictException('Credit request not found');
      }
    }

    const internalNote = new this.creditInternalNoteModel({
      [noteType === InternalNoteType.APPLICATION
        ? 'creditApplication'
        : 'creditRequest']: targetId,
      createdBy: adminUserId,
      ...noteDetails,
    });

    await internalNote.save();

    // Populate the createdBy field with admin user details
    await internalNote.populate('createdBy', 'firstName lastName email');

    return successResponse('Internal note created successfully', internalNote);
  }

  /**
   * Retrieves all internal notes for a specific credit application or request.
   * @param targetId - The ID of the credit application or request.
   * @param queryParams - Query parameters for filtering and pagination.
   * @returns A list of internal notes.
   */
  async getInternalNotes(
    targetId: string,
    queryParams: GetInternalNotesQueryDto & QueryParamsDto,
  ): Promise<any> {
    const { limit = 50, page = 1, noteType } = queryParams;

    // Verify target exists based on note type
    if (noteType === InternalNoteType.APPLICATION) {
      const creditApplication = await this.creditModel.findById(targetId);
      if (!creditApplication) {
        throw new ConflictException('Credit application not found');
      }
    } else if (noteType === InternalNoteType.REQUEST) {
      const creditRequest = await this.creditRequestModel.findById(targetId);
      if (!creditRequest) {
        throw new ConflictException('Credit request not found');
      }
    }

    const filter: any = {
      noteType,
      [noteType === InternalNoteType.APPLICATION
        ? 'creditApplication'
        : 'creditRequest']: new Types.ObjectId(targetId),
    };

    const result = await paginationUtil.paginate({
      model: this.creditInternalNoteModel,
      page,
      limit,
      filter,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'createdBy',
          select: 'firstName lastName email',
        },
      ],
    });

    const notes = result.data;
    const meta = result.meta;

    return successResponse('Internal notes retrieved successfully', {
      notes,
      meta,
    });
  }
}
