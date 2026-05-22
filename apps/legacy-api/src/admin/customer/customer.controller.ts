import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import {
  CustomerFiterParams,
  OrderFilterParams,
  TransactionFiterParams,
} from '../../utils/filter';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';
import { RequiredPermission } from '../role/enum/required-permission';
import { DateFilterDto } from '../product/dto/create-product.dto';

@Controller('admin/customer')
@AdminAuth()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getCustomers(@Query() queryParams: CustomerFiterParams) {
    return await this.customerService.getCustomers(queryParams);
  }

  @Get('ranking')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getCustomerRanking(@Query() query: DateFilterDto) {
    return await this.customerService.getCustomerRanking(query);
  }

  @Get(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getSingleCustomer(@Param('id') customerId: string) {
    return await this.customerService.getCustomerById(customerId);
  }

  @Get(':id/transactions')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getCustomerTransactions(
    @Param('id') customerId: string,
    @Query() query: TransactionFiterParams,
  ) {
    return await this.customerService.getCustomerTransactions(
      customerId,
      query,
    );
  }

  @Get(':id/orders')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getCustomerOrders(
    @Param('id') customerId: string,
    @Query() query: OrderFilterParams,
  ) {
    return await this.customerService.getCustomerOrders(customerId, query);
  }

  @Get(':id/orders-summary')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getCustomerOrdersSummary(@Param('id') customerId: string) {
    return await this.customerService.getCustomerOrdersSummary(customerId);
  }

  @Get(':id/credit-history')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getCustomerCreditHistory(
    @Param('id') customerId: string,
    @Query() query: TransactionFiterParams,
  ) {
    return await this.customerService.getCustomerCreditHistory(
      customerId,
      query,
    );
  }

  @Get(':id/credit-summary')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getCustomerCreditSummary(@Param('id') customerId: string) {
    return await this.customerService.getCustomerCreditSummary(customerId);
  }

  @Get(':id/business-branches')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async getBusinessBranches(
    @Param('id') businessId: string,
    @Query() query: TransactionFiterParams,
  ) {
    return await this.customerService.getBusinessBranches(businessId, query);
  }

  @Patch('enable-credit/:id')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.ENABLE_DISABLE_CUSTOMER_CREDIT,
  )
  @UseGuards(AdminRolesGuard)
  async enableCredit(@Param('id') customerId: string) {
    return await this.customerService.enableCredit(customerId);
  }

  @Patch('disable-credit/:id')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.ENABLE_DISABLE_CUSTOMER_CREDIT,
  )
  @UseGuards(AdminRolesGuard)
  async disableCredit(@Param('id') customerId: string) {
    return await this.customerService.disableCredit(customerId);
  }

  @Post(':id/reset-password')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MODIFY_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async resetPassword(@Param('id') customerId: string) {
    return await this.customerService.resetCustomerPassword(customerId);
  }

  @Patch(':id/activate')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.ACTIVATE_DEACTIVATE_CUSTOMER,
  )
  @UseGuards(AdminRolesGuard)
  async activateCustomer(@Param('id') customerId: string) {
    return await this.customerService.setCustomerActive(customerId, true);
  }

  @Patch(':id/deactivate')
  @Roles(
    AdminRoles.SUPER_ADMIN,
    RequiredPermission.ACTIVATE_DEACTIVATE_CUSTOMER,
  )
  @UseGuards(AdminRolesGuard)
  async deactivateCustomer(@Param('id') customerId: string) {
    return await this.customerService.setCustomerActive(customerId, false);
  }

  @Delete(':id')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.DELETE_CUSTOMER)
  @UseGuards(AdminRolesGuard)
  async deleteCustomer(@Param('id') customerId: string) {
    return await this.customerService.deleteCustomer(customerId);
  }
}
