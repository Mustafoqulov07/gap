import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guard/jwt-auth.guard';
import { UserUpdateDto } from './dto/user-update.dto';
import { RolesGuard } from '../../common/guard/roles.guard';
import { AccessRoles } from '../../common/decorator/roles.decorator';
import { Roles } from '../../common/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { UserId } from '../../common/decorator/current-user.decorator';
import { FILE_OPTIONS } from '../../infrastructure/lib/File';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ImageValidationPipe } from '../../common/pipe/image-validation.pipe';

@Controller('user')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @AccessRoles('ID')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Get()
  @AccessRoles(Roles.SUPER_ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @Patch(':id')
  @AccessRoles('ID')
  @UseInterceptors(FileInterceptor('file', FILE_OPTIONS))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserUpdateDto,
    @UploadedFile(new ImageValidationPipe()) file?: Express.Multer.File,
  ) {
    return this.userService.update(id, dto, file);
  }

  @Delete(':id')
  @AccessRoles('ID')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UserId() currentUserId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.remove(id, currentUserId, res);
  }

  @Patch(':id/status')
  @AccessRoles(Roles.SUPER_ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.userService.updateStatus(id, dto.status);
  }
}
