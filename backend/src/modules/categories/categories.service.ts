import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Status } from '@/common/enums/status.enum';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.categoriesRepository.findOne({
      where: [
        { name: createCategoryDto.name },
        { code: createCategoryDto.code },
      ],
    });

    if (existingCategory) {
      throw new ConflictException('分类名称或编码已存在');
    }

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      status: createCategoryDto.status || Status.ACTIVE,
      sort: createCategoryDto.sort || 0,
    });

    return this.categoriesRepository.save(category);
  }

  async findAll() {
    return this.categoriesRepository.find({
      where: { status: Status.ACTIVE },
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id, status: Status.ACTIVE },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async findByCode(code: string) {
    return this.categoriesRepository.findOne({
      where: { code, status: Status.ACTIVE },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (updateCategoryDto.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('分类名称已存在');
      }
    }

    if (updateCategoryDto.code) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { code: updateCategoryDto.code },
      });
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('分类编码已存在');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    category.status = Status.DELETED;
    await this.categoriesRepository.save(category);
  }
}
