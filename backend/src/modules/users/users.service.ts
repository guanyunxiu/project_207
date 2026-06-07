import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Role } from '@/common/enums/role.enum';
import { Status } from '@/common/enums/status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || Role.EMPLOYEE,
    });

    return this.usersRepository.save(user);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, pageSize, keyword } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where = keyword
      ? [
          { username: ILike(`%${keyword}%`), status: Status.ACTIVE },
          { nickname: ILike(`%${keyword}%`), status: Status.ACTIVE },
          { email: ILike(`%${keyword}%`), status: Status.ACTIVE },
        ]
      : { status: Status.ACTIVE };

    const [items, total] = await this.usersRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      select: ['id', 'username', 'email', 'nickname', 'avatar', 'phone', 'department', 'position', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAllUsers() {
    return this.usersRepository.find({
      where: { status: Status.ACTIVE },
      select: ['id', 'username', 'nickname', 'avatar', 'department', 'position'],
      order: { department: 'ASC', username: 'ASC' },
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'nickname', 'avatar', 'phone', 'department', 'position', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updatePassword(id: number, hashedPassword: string) {
    return this.usersRepository.update(id, { password: hashedPassword });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('用户名已存在');
      }
    }

    if (updateUserDto.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('邮箱已存在');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    user.status = Status.DELETED;
    await this.usersRepository.save(user);
  }
}
