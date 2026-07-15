import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateFilterDto, UpdateFilterDto } from './dto/filter.dto';
import { FiltersService } from './filters.service';

@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get()
  findAll() {
    return this.filtersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filtersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFilterDto) {
    return this.filtersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFilterDto) {
    return this.filtersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filtersService.remove(id);
  }
}
