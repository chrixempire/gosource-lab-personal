import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Credit } from '../../credit/schema/credit.schema';
import { CreditDocumentChecklist } from '../../credit/schema/creditDocumentChecklist.schema';
import { UpdateDocumentStatusDto } from '../../credit/dto/creditDocumentChecklist.dto';
import { CreditTimelineStatusT } from '../../credit/enum/credit.enum';
import { S3Service } from '../../cloudinary/s3.service';
import { successResponse } from '../../utils/responses';

@Injectable()
export class CreditDocumentsService {
  constructor(
    @InjectModel(Credit.name) private creditModel: Model<Credit>,
    @InjectModel(CreditDocumentChecklist.name)
    private checklistModel: Model<CreditDocumentChecklist>,
    private s3Service: S3Service,
  ) {}

  /**
   * Admin can add additional documents for customer
   * @param applicationId - The ID of the credit application
   * @param files - Documents to be uploaded
   * @returns The updated credit application
   */
  async addAdditionalApplicationDoc(
    applicationId: string,
    files: any,
    admin: any,
  ) {
    const creditApplication = await this.creditModel.findById(applicationId);
    if (!creditApplication) {
      throw new NotFoundException('Credit application not found');
    }

    const docs = await Promise.all(
      files.map((file) => {
        return this.s3Service.uploadFile(file);
      }),
    );

    creditApplication.additionalDocs = [
      ...docs,
      ...creditApplication.additionalDocs,
    ];

    creditApplication.timeline.unshift({
      status: CreditTimelineStatusT.DOC_ADDED,
      changedBy: admin.id,
      changedAt: new Date(),
      note: `${files.length} additional document(s) added`,
    });

    await creditApplication.save();

    return successResponse('Documents added successfully', creditApplication);
  }

  /**
   * Delete document from the credit application
   * @param applicationId - The ID of the credit application
   * @param docKey - The document key on s3 bucket
   * @returns The updated credit application
   */
  async deleteAdditionalDoc(applicationId: string, docKey: string) {
    const application = await this.creditModel.findById(applicationId);

    if (!application) {
      throw new NotFoundException('Credit application not found');
    }

    // Delete from S3
    await this.s3Service.deleteFile(docKey);

    // Remove from array
    application.additionalDocs = application.additionalDocs.filter(
      (doc) => doc.key !== docKey,
    );

    await application.save();
    return successResponse('Document deleted successfully', application);
  }

  /**
   * Initialise required documents to verify
   * @param applicationId - credit application id
   * @param requiredDocuments - array of string for required documents to verify
   * @returns The created checklist
   */
  async initialiseApplicationCheckist(
    applicationId: string,
    requiredDocuments: string[],
  ) {
    const application = await this.creditModel.findById(applicationId);
    const getExisting = await this.checklistModel.findOne({ applicationId });

    if (!application) {
      throw new NotFoundException('Credit application not found');
    }

    if (getExisting) {
      throw new ConflictException(
        'Documents checklist already created for this application',
      );
    }

    const checklistItems = requiredDocuments.map((docName) => ({
      name: docName,
      verified: false,
      required: true,
    }));

    const checklist = new this.checklistModel({
      applicationId,
      documents: checklistItems,
      isComplete: false,
    });

    await checklist.save();

    return successResponse(
      'Application checklist saved successfully',
      checklist,
    );
  }

  async getApplicationChecklist(applicationId: string) {
    const checklist = await this.checklistModel
      .findOne({ applicationId })
      .populate('documents.verifiedBy');

    return successResponse(
      'Fetched application checklist successfully',
      checklist || [],
    );
  }

  /**
   * Update checklist of document/information the customer has submitted for credit application
   * @param applicationId - credit application id
   * @param data - UpdateDocumentStatusDto params
   * @param admin - signed in admin. The admin verifying documents
   * @returns The updated application checklist
   */
  async updateApplicationChecklist(
    applicationId: string,
    data: UpdateDocumentStatusDto,
    admin: any,
  ) {
    const { verified, documentName } = data;

    const checklist = await this.checklistModel.findOne({ applicationId });

    if (!checklist) {
      throw new NotFoundException(
        `Checklist for application ${applicationId} not found`,
      );
    }

    const documentIndex = checklist.documents.findIndex(
      (doc) => doc.name === documentName,
    );
    if (documentIndex === -1) {
      throw new NotFoundException(
        `Document does not exist in application checklist`,
      );
    }

    // Update the specific document
    const document = checklist.documents[documentIndex];
    document.verified = verified;
    if (verified) {
      document.verifiedAt = new Date();
      document.verifiedBy = admin.id;
    } else {
      document.verifiedAt = undefined;
      document.verifiedBy = undefined;
    }

    // Check completion status
    const allSubmitted = checklist.documents.every(
      (doc) => doc.required && doc.verified,
    );

    if (allSubmitted !== checklist.isComplete) {
      checklist.isComplete = allSubmitted;
      checklist.completedAt = allSubmitted ? new Date() : undefined;
    }

    await checklist.save();

    const checkListWithPopulatedData = await checklist.populate(
      'documents.verifiedBy',
    );

    return successResponse(
      'Application checklist updated successfully',
      checkListWithPopulatedData,
    );
  }

  async deleteApplicationChecklist(applicationId: string) {
    await this.checklistModel.findOneAndDelete({
      applicationId,
    });

    return successResponse('Application checklist deleted successfully');
  }
}
