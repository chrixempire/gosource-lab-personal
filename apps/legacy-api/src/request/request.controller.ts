import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequestService } from './request.service';
import {
  addProductDto,
  ApproveRequestDto,
  CreateRequestDto,
  RejectRequestDto,
  updateQuantityDto,
  UpdateRequestDto,
} from './dto/request.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Business } from '../business/decorator/business.decorator';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';
import { SuperAdminGuard } from '../business/guard/role.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('request')
@ApiTags('Request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createRequest(
    @Body() requestBody: CreateRequestDto,
    @Business() business: any,
  ) {
    return await this.requestService.createRequest(requestBody, business);
  }

  @Post('shopping-list/:listId')
  @UseGuards(AuthGuard)
  async createRequestFromList(
    @Param('listId') listId: string,
    @Body() requestBody: CreateRequestDto,
    @Business() business: any,
  ) {
    return await this.requestService.createRequest(
      requestBody,
      business,
      listId,
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  async getOrdersByBranch(
    @Query() queryParams: QueryParamsDto,
    @Business() business: any,
  ) {
    return await this.requestService.getRequests(queryParams, business);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getSingleRequest(
    @Param('id') requestId: string,
    @Business() business: any,
  ) {
    return await this.requestService.getSingleRequest(requestId, business);
  }

  @Patch('update-product-quantity')
  @UseGuards(AuthGuard)
  async updateProductQuantity(
    @Body() data: updateQuantityDto,
    @Business() business: any,
  ) {
    return await this.requestService.updateProductQuantity(data, business);
  }

  @Patch('add-product/:id')
  @UseGuards(AuthGuard)
  async addProductToRequest(
    @Body() data: addProductDto,
    @Param('id') requestId: string,
    @Business() business: any,
  ) {
    return await this.requestService.addProductToRequest(
      data,
      business,
      requestId,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateRequest(
    @Body() requestBody: UpdateRequestDto,
    @Param('id') requestId: string,
    @Business() business: any,
  ) {
    return await this.requestService.updateRequest(
      requestBody,
      requestId,
      business,
    );
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async approveRequest(
    @Param('id') requestId: string,
    @Business() business: any,
    @Body() requestDetails: ApproveRequestDto,
  ) {
    return await this.requestService.approveRequest(
      requestId,
      business,
      requestDetails,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard)
  async cancelRequest(@Param('id') requestId: string, @Business() business: any) {
    return await this.requestService.cancelRequest(requestId, business);
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async rejectRequest(
    @Param('id') requestId: string,
    @Body() rejectionDetails: RejectRequestDto,
    @Business() business: any,
  ) {
    return await this.requestService.rejectRequest(
      rejectionDetails,
      requestId,
      business,
    );
  }

  @Delete(':requestId/product/:cartId')
  @UseGuards(AuthGuard)
  async removeProductFromRequest(
    @Param('requestId') requestId: string,
    @Param('cartId') cartId: string,
    @Business() business: any,
  ) {
    return await this.requestService.removeProductFromRequest(
      requestId,
      cartId,
      business,
    );
  }
}
