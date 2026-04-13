import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';
import { TerminateLeaseDto } from './dto/terminate-lease.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leases')
export class LeasesController {
  constructor(private readonly service: LeasesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all leases' })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  findAll(@Query('unitId') unitId?: string, @Query('tenantId') tenantId?: string) {
    if (unitId) return this.service.findByUnit(unitId);
    if (tenantId) return this.service.findByTenant(tenantId);
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a lease by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a lease with auto-generated payment schedule' })
  create(@Body() dto: CreateLeaseDto) {
    return this.service.createLeaseWithPayments(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a lease' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeaseDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/terminate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Terminate a lease' })
  terminate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TerminateLeaseDto) {
    return this.service.terminateLease(id, dto.reason);
  }

  @Post(':id/renew')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Renew a lease' })
  renew(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RenewLeaseDto) {
    return this.service.renewLease(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a lease' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
