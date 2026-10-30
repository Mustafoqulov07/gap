import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { GapService } from './gap.service';
import { AuthGuard } from '../../common/guard/jwt-auth.guard';
import {
    UserId,
    UserRole,
} from '../../common/decorator/current-user.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGapDto } from './dto/create-gap.dto';
import { Roles } from '../../common/enum';
import { UpdateGapDto } from './dto/update-gap.dto';

@UseGuards(AuthGuard)
@Controller('gap')
export class GapController {
    constructor(private readonly gapService: GapService) { }

    @Post()
    create(@UserId() userId: number, @Body() dto: CreateGapDto) {
        return this.gapService.create(userId, dto);
    }

    @Post(':id/member')
    addMember(
        @UserId() organizerId: number,
        @Param('id', ParseIntPipe) gapId: number,
        @Body() dto: AddMemberDto,
    ) {
        return this.gapService.addMember(organizerId, gapId, dto.userId);
    }

    @Post(':id/start')
    startGap(@UserId() userId: number, @Param('id', ParseIntPipe) gapId: number) {
        return this.gapService.startGap(userId, gapId);
    }

    @Patch(':id/cancel')
    cancel(
        @UserId() userId: number,
        @UserRole() role: Roles,
        @Param('id', ParseIntPipe) gapId: number,
    ) {
        return this.gapService.cancel(userId, role, gapId);
    }

    @Get()
    findAll(@UserId() userId: number, @UserRole() role: Roles) {
        return this.gapService.findAll(userId, role);
    }

    @Patch(':id')
    update(
        @UserId() userId: number,
        @UserRole() role: Roles,
        @Param('id', ParseIntPipe) gapId: number,
        @Body() dto: UpdateGapDto,
    ) {
        return this.gapService.update(userId, role, gapId, dto);
    }

    @Get(':id')
    findOne(
        @UserId() userId: number,
        @UserRole() role: Roles,
        @Param('id', ParseIntPipe) gapId: number,
    ) {
        return this.gapService.findOne(userId, role, gapId);
    }

    @Delete(':id/member/:userId')
    removeMember(
        @UserId() currentUserId: number,
        @UserRole() role: Roles,
        @Param('id', ParseIntPipe) gapId: number,
        @Param('userId', ParseIntPipe) memberId: number,
    ) {
        return this.gapService.removeMember(currentUserId, role, gapId, memberId);
    }

    @Delete(':id')
    remove(
        @UserId() userId: number,
        @UserRole() role: Roles,
        @Param('id', ParseIntPipe) gapId: number,
    ) {
        return this.gapService.remove(userId, role, gapId);
    }
}
