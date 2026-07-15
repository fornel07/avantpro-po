import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SavedFilter } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilterDto, UpdateFilterDto } from './dto/filter.dto';

@Injectable()
export class FiltersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SavedFilter[]> {
    return this.prisma.savedFilter.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string): Promise<SavedFilter> {
    const filter = await this.prisma.savedFilter.findUnique({ where: { id } });
    if (!filter) {
      throw new NotFoundException(`Filter ${id} not found`);
    }
    return filter;
  }

  create(dto: CreateFilterDto): Promise<SavedFilter> {
    return this.prisma.savedFilter.create({
      data: {
        name: dto.name,
        query: dto.query as Prisma.InputJsonValue,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateFilterDto): Promise<SavedFilter> {
    await this.findOne(id);
    const data: Prisma.SavedFilterUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.query !== undefined) {
      data.query = dto.query as Prisma.InputJsonValue;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    return this.prisma.savedFilter.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<SavedFilter> {
    await this.findOne(id);
    return this.prisma.savedFilter.delete({ where: { id } });
  }
}
