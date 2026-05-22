import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Branch, BranchDocument } from './entities/branch.entity';
import { Model } from 'mongoose';
import { BusinessCustomer } from '../business/schema/business.schema';
import {
  Employee,
  EmployeeDocument,
} from '../employee/entities/employee.entity';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class BranchService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  /**
   * Create a new branch.
   *
   * @param branchDetails
   * @param businessId
   * @returns {object}
   */
  async createBranch(
    branchDetails: CreateBranchDto,
    businessId: string,
  ): Promise<any> {
    const { branchName } = branchDetails;

    const [checkBranch, business, allBranch] = await Promise.all([
      this.branchModel
        .findOne({
          branchName,
          businessId,
        })
        .exec(),
      this.businessModel.findById(businessId).exec(),
      this.branchModel.countDocuments({ businessId }).exec(),
    ]);

    if (checkBranch) {
      throw new ConflictException('Branch with the name already exist');
    }

    let branchCode = `${business.businessName.slice(0, 3)}-${Math.floor(
      100000 + Math.random() * 900000,
    )}`;

    branchCode = branchCode.toUpperCase();

    const newBranch = {
      businessId,
      branchCode,
      isHeadquarter: allBranch > 0 ? false : true,
      ...branchDetails,
    };

    const createdBranch: BranchDocument =
      await this.branchModel.create(newBranch);

    if (createdBranch) {
      return this.buildResponse(createdBranch, 'Branch created successfully');
    }
  }

  /**
   * Get all branches for a business.
   *
   * @param businessId
   * @returns {object}
   */
  async getAllBranches(businessId: string): Promise<any> {
    let branches: BranchDocument[] = [];

    const search: BranchDocument[] = await this.branchModel.find({
      businessId,
    });

    if (search.length) {
      branches = search;
    } else {
      const employee: EmployeeDocument =
        await this.employeeModel.findById(businessId);
      if (employee) {
        const branch: BranchDocument = await this.branchModel.findById(
          employee.branchId,
        );

        if (branch) {
          branches.push(branch);
        }
      }
    }

    const branchesWithEmployees = await Promise.all(
      branches.map(async (branch) => {
        const employees = await this.employeeModel.find({
          branchId: branch._id,
        });

        const result = await this.orderModel.aggregate([
          { $match: { branch: branch._id } },
          {
            $group: {
              _id: '$branch',
              totalAmountProcured: { $sum: '$totalPrice' },
              totalItemsPurchased: { $sum: { $sum: '$products.quantity' } },
              totalOrders: { $sum: 1 },
            },
          },
        ]);

        const totalAmountProcured = result[0]?.totalAmountProcured
          ? result[0].totalAmountProcured
          : 0;
        const totalItemsPurchased = result[0]?.totalItemsPurchased
          ? result[0].totalItemsPurchased
          : 0;
        const totalOrders = result[0]?.totalOrders ? result[0].totalOrders : 0;

        return {
          ...branch.toObject(),
          employees,
          totalOrders,
          totalItemsPurchased,
          totalAmountProcured,
        };
      }),
    );

    return this.buildResponse(
      branchesWithEmployees,
      'Branches retrieved successfully',
    );
  }

  /**
   * Get a branch by Id.
   * @param id
   * @param businessId
   * @returns {object}
   */
  async getBranchById(id: string, businessId: string): Promise<any> {
    let scopedBusinessId = businessId;

    const employee = await this.employeeModel.findById(businessId).lean();
    if (employee?.businessId) {
      scopedBusinessId = employee.businessId.toString();
    }

    const branch = await this.branchModel.findOne({
      _id: id,
      businessId: scopedBusinessId,
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const result = await this.orderModel.aggregate([
      { $match: { branch: branch._id } },
      {
        $group: {
          _id: '$branch',
          totalAmountProcured: { $sum: '$totalPrice' },
          totalItemsPurchased: { $sum: { $sum: '$products.quantity' } },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalAmountProcured = result[0]?.totalAmountProcured
      ? result[0].totalAmountProcured
      : 0;
    const totalItemsPurchased = result[0]?.totalItemsPurchased
      ? result[0].totalItemsPurchased
      : 0;
    const totalOrders = result[0]?.totalOrders ? result[0].totalOrders : 0;

    const altBranch = branch.toObject();

    const branchData = {
      totalAmountProcured,
      totalItemsPurchased,
      totalOrders,
      ...altBranch,
    };

    return this.buildResponse(branchData, 'Branch retrieved successfully');
  }

  async update(
    _id: string,
    business: string,
    updateBranchDto: UpdateBranchDto,
  ) {
    const filter = { _id, businessId: business };

    const result = await this.branchModel.findByIdAndUpdate(
      filter,
      updateBranchDto,
      {
        new: true,
      },
    );

    if (!result) {
      throw new NotFoundException('Branch with Id not found');
    }

    return this.buildResponse(result, 'Branch updated successfully');
  }

  buildResponse(data: any, message: string = 'successfully') {
    return {
      status: true,
      message,
      data,
    };
  }

  /**
   * Make a branch a headquarter.
   *
   * @param branchId
   * @param businessId
   * @returns {object}
   */
  async makeBranchHeadquarter(
    branchId: string,
    businessId: string,
  ): Promise<any> {
    const branch = await this.branchModel.findOne({
      _id: branchId,
      businessId,
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if there is an existing headquarter
    const headquarter = await this.branchModel.findOne({
      businessId,
      isHeadquarter: true,
    });

    if (headquarter) {
      headquarter.isHeadquarter = false;
      headquarter.save();

      const update = await this.branchModel.findOneAndUpdate(
        { _id: branchId, businessId },
        { isHeadquarter: true },
        { new: true },
      );

      return this.buildResponse(update, 'Branch is now headquarter');
    }

    const update = await this.branchModel.findOneAndUpdate(
      { _id: branchId, businessId },
      { isHeadquarter: true },
      { new: true },
    );
    return this.buildResponse(update, 'Branch is now headquarter');
  }

  /**
   * Deactivate a branch.
   *
   * @param branchId
   * @param businessId
   * @returns {object}
   */
  async deactivateBranch(branchId: string, businessId: string): Promise<any> {
    const branch = await this.branchModel.findOne({
      _id: branchId,
      businessId,
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    const update = await this.branchModel.findOneAndUpdate(
      { _id: branchId, businessId },
      { isDeactivated: true },
      { new: true },
    );
    return this.buildResponse(update, 'Branch deactivated successfully');
  }

  /**
   * Activate a branch.
   *
   * @param branchId
   * @param businessId
   * @returns {object}
   */
  async activateBranch(branchId: string, businessId: string): Promise<any> {
    const branch = await this.branchModel.findOne({
      _id: branchId,
      businessId,
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    const update = await this.branchModel.findOneAndUpdate(
      { _id: branchId, businessId },
      { isDeactivated: false },
      { new: true },
    );
    return this.buildResponse(update, 'Branch activated successfully');
  }

  /**
   * Remove a branch.
   *
   * @param branchId
   * @param businessId
   * @returns
   */
  async removeBranch(branchId: string, businessId: string): Promise<any> {
    const branch = await this.branchModel.findOne({
      _id: branchId,
      businessId,
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.branchModel.deleteOne({ _id: branchId, businessId });
    return this.buildResponse(null, 'Branch removed successfully');
  }
}
