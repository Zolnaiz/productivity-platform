import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../shared/constants';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    return this.expensesService.create(createExpenseDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Request() req,
  ) {
    return this.expensesService.findAll(
      {
        page,
        limit,
        search,
        category,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
      },
      req.user,
    );
  }

  @Get('my-expenses')
  @ApiOperation({ summary: 'Get current user expenses' })
  findMyExpenses(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return this.expensesService.findMyExpenses({ page, limit }, req.user);
  }

  @Get('pending')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get pending expenses' })
  findPending(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return this.expensesService.findPending({ page, limit }, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.expensesService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req,
  ) {
    return this.expensesService.update(id, updateExpenseDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  remove(@Param('id') id: string, @Request() req) {
    return this.expensesService.remove(id, req.user);
  }

  @Post(':id/submit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Submit expense for approval' })
  submit(@Param('id') id: string, @Request() req) {
    return this.expensesService.submit(id, req.user);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Approve expense' })
  approve(
    @Param('id') id: string,
    @Body('comments') comments?: string,
    @Request() req,
  ) {
    return this.expensesService.approve(id, req.user, comments);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Reject expense' })
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.expensesService.reject(id, req.user, reason);
  }

  @Post(':id/pay')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Mark expense as paid' })
  pay(
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod?: string,
    @Body('paymentReference') paymentReference?: string,
    @Request() req,
  ) {
    return this.expensesService.pay(id, req.user, paymentMethod, paymentReference);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get expense attachments' })
  getAttachments(@Param('id') id: string, @Request() req) {
    return this.expensesService.getAttachments(id, req.user);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Add attachment to expense' })
  addAttachment(
    @Param('id') id: string,
    @Body('url') url: string,
    @Body('name') name: string,
    @Request() req,
  ) {
    return this.expensesService.addAttachment(id, url, name, req.user);
  }

  @Delete(':id/attachments/:attachmentId')
  @ApiOperation({ summary: 'Remove attachment from expense' })
  removeAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Request() req,
  ) {
    return this.expensesService.removeAttachment(id, attachmentId, req.user);
  }

  @Get('organization/:organizationId/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get organization expense statistics' })
  getOrganizationStats(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req,
  ) {
    return this.expensesService.getOrganizationStats(
      organizationId,
      startDate,
      endDate,
      req.user,
    );
  }

  @Get('categories/summary')
  @ApiOperation({ summary: 'Get expense categories summary' })
  getCategoriesSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req,
  ) {
    return this.expensesService.getCategoriesSummary(
      req.user,
      startDate,
      endDate,
    );
  }
}