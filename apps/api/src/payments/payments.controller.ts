import {
  Controller, Get, Post, Body, Param, ParseUUIDPipe,
  UseGuards, Query, HttpCode, HttpStatus, Headers, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // Stripe webhook — no auth guard (raw body)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  handleWebhook(@Req() req: Request, @Headers('stripe-signature') sig: string) {
    return this.service.handleStripeWebhook(req.body as Buffer, sig);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all payments' })
  @ApiQuery({ name: 'leaseId', required: false })
  findAll(@Query('leaseId') leaseId?: string) {
    if (leaseId) return this.service.findByLease(leaseId);
    return this.service.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a payment by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a manual payment record' })
  create(@Body() dto: CreatePaymentDto) {
    return this.service.create(dto);
  }

  @Post(':id/record')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a payment (partial or full)' })
  record(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RecordPaymentDto) {
    return this.service.recordPayment(id, dto);
  }

  @Post(':id/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TENANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  checkout(@Param('id', ParseUUIDPipe) id: string, @Body('tenantEmail') email: string) {
    return this.service.createStripeCheckout(id, email);
  }
}
