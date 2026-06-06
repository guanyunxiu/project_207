import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Document } from '../../modules/documents/entities/document.entity';
import { Role } from '../../common/enums/role.enum';
import { Status } from '../../common/enums/status.enum';

config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USER', 'kb_user'),
  password: configService.get('DATABASE_PASSWORD', 'kb_password'),
  database: configService.get('DATABASE_NAME', 'kb_db'),
  entities: [User, Category, Document],
  synchronize: true,
  logging: false,
});

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

const seed = async () => {
  console.log('🌱 开始数据库初始化...');

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    const userRepository = dataSource.getRepository(User);
    const categoryRepository = dataSource.getRepository(Category);
    const documentRepository = dataSource.getRepository(Document);

    const existingUsers = await userRepository.find();
    if (existingUsers.length > 0) {
      console.log('ℹ️  数据库已存在数据，跳过初始化');
      await dataSource.destroy();
      return;
    }

    console.log('👤 创建用户账号...');
    const hashedPassword = await hashPassword('123456');

    const users: Partial<User>[] = [
      {
        username: 'superadmin',
        email: 'superadmin@company.com',
        password: hashedPassword,
        nickname: '超级管理员',
        role: Role.SUPER_ADMIN,
        status: Status.ACTIVE,
        phone: '13800000001',
        department: '总裁办',
        position: '系统管理员',
      },
      {
        username: 'hradmin',
        email: 'hradmin@company.com',
        password: hashedPassword,
        nickname: 'HR管理员',
        role: Role.HR_ADMIN,
        status: Status.ACTIVE,
        phone: '13800000002',
        department: '人力资源部',
        position: 'HR主管',
      },
      {
        username: 'assessmentadmin',
        email: 'assessment@company.com',
        password: hashedPassword,
        nickname: '测评管理员',
        role: Role.ASSESSMENT_ADMIN,
        status: Status.ACTIVE,
        phone: '13800000003',
        department: '心理健康中心',
        position: '测评专员',
      },
      {
        username: 'employee',
        email: 'employee@company.com',
        password: hashedPassword,
        nickname: '普通员工',
        role: Role.EMPLOYEE,
        status: Status.ACTIVE,
        phone: '13800000004',
        department: '研发部',
        position: '前端工程师',
      },
      {
        username: 'zhangsan',
        email: 'zhangsan@company.com',
        password: hashedPassword,
        nickname: '张三',
        role: Role.EMPLOYEE,
        status: Status.ACTIVE,
        phone: '13800000005',
        department: '研发部',
        position: '后端工程师',
      },
      {
        username: 'lisi',
        email: 'lisi@company.com',
        password: hashedPassword,
        nickname: '李四',
        role: Role.EMPLOYEE,
        status: Status.ACTIVE,
        phone: '13800000006',
        department: '产品部',
        position: '产品经理',
      },
    ];

    const savedUsers = await userRepository.save(users as User[]);
    console.log(`✅ 成功创建 ${savedUsers.length} 个用户账号`);

    console.log('📁 创建文档分类...');
    const categories: Partial<Category>[] = [
      {
        name: '技术文档',
        code: 'TECH',
        description: '技术相关文档，包括开发规范、架构设计、技术分享等',
        sort: 1,
        status: Status.ACTIVE,
      },
      {
        name: '行政制度',
        code: 'ADMIN',
        description: '公司行政规章制度、流程规范、通知公告等',
        sort: 2,
        status: Status.ACTIVE,
      },
      {
        name: '产品资料',
        code: 'PRODUCT',
        description: '产品需求文档、原型设计、竞品分析等',
        sort: 3,
        status: Status.ACTIVE,
      },
      {
        name: '培训材料',
        code: 'TRAINING',
        description: '新员工培训、技能培训、职业发展等培训资料',
        sort: 4,
        status: Status.ACTIVE,
      },
    ];

    const savedCategories = await categoryRepository.save(categories as Category[]);
    console.log(`✅ 成功创建 ${savedCategories.length} 个文档分类`);

    console.log('📄 创建示例文档...');
    const techCategory = savedCategories.find(c => c.code === 'TECH');
    const adminCategory = savedCategories.find(c => c.code === 'ADMIN');
    const productCategory = savedCategories.find(c => c.code === 'PRODUCT');
    const trainingCategory = savedCategories.find(c => c.code === 'TRAINING');
    const superAdminUser = savedUsers.find(u => u.username === 'superadmin');

    const documents: Partial<Document>[] = [
      {
        title: 'Git 分支管理规范',
        content: `<h2>1. 分支命名规范</h2><p>功能分支：feature/功能名称</p><p>修复分支：bugfix/问题描述</p><p>发布分支：release/版本号</p><h2>2. 提交流程</h2><p>1. 创建功能分支</p><p>2. 开发完成后提交PR</p><p>3. Code Review 通过后合并</p>`,
        summary: '详细介绍了团队使用 Git 进行分支管理的规范和流程',
        categoryId: techCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 128,
        attachments: [],
      },
      {
        title: 'TypeScript 编码规范',
        content: `<h2>1. 命名规范</h2><p>类名：PascalCase</p><p>方法名：camelCase</p><p>常量：UPPER_SNAKE_CASE</p><h2>2. 类型定义</h2><p>优先使用 interface 定义类型</p><p>避免使用 any 类型</p>`,
        summary: 'TypeScript 项目的编码规范和最佳实践指南',
        categoryId: techCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 256,
        attachments: [],
      },
      {
        title: '员工考勤管理制度',
        content: `<h2>1. 工作时间</h2><p>周一至周五：9:00 - 18:00</p><p>午休时间：12:00 - 13:30</p><h2>2. 打卡规定</h2><p>上下班必须打卡</p><p>迟到30分钟以上算旷工半天</p>`,
        summary: '公司员工考勤管理的详细制度说明',
        categoryId: adminCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 512,
        attachments: [],
      },
      {
        title: '报销流程指引',
        content: `<h2>1. 报销范围</h2><p>差旅费、办公采购、业务招待费等</p><h2>2. 报销流程</h2><p>1. 填写报销单</p><p>2. 上传发票凭证</p><p>3. 部门主管审批</p><p>4. 财务审核</p><p>5. 打款到工资卡</p>`,
        summary: '员工费用报销的详细流程和注意事项',
        categoryId: adminCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 320,
        attachments: [],
      },
      {
        title: '产品需求文档模板',
        content: `<h2>1. 文档结构</h2><p>1.1 版本历史</p><p>1.2 需求背景</p><p>1.3 用户故事</p><p>1.4 功能详情</p><p>1.5 非功能需求</p><h2>2. 编写规范</h2><p>使用清晰、无歧义的语言描述需求</p>`,
        summary: '产品经理编写需求文档的标准模板',
        categoryId: productCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 89,
        attachments: [],
      },
      {
        title: '用户调研方法论',
        content: `<h2>1. 调研方法</h2><p>1.1 用户访谈</p><p>1.2 问卷调查</p><p>1.3 可用性测试</p><h2>2. 调研流程</h2><p>确定目标 -> 设计方案 -> 执行调研 -> 分析结果 -> 输出报告</p>`,
        summary: '产品团队进行用户调研的方法论和实践指南',
        categoryId: productCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 67,
        attachments: [],
      },
      {
        title: '新员工入职指南',
        content: `<h2>1. 入职第一天</h2><p>1.1 办理入职手续</p><p>1.2 领取办公设备</p><p>1.3 开通系统账号</p><h2>2. 第一周安排</h2><p>熟悉公司文化、组织架构、业务流程</p>`,
        summary: '帮助新员工快速融入公司的入职指南',
        categoryId: trainingCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 45,
        attachments: [],
      },
      {
        title: '高效沟通技巧培训',
        content: `<h2>1. 沟通原则</h2><p>1.1 清晰表达</p><p>1.2 积极倾听</p><p>1.3 及时反馈</p><h2>2. 不同场景的沟通技巧</h2><p>向上沟通、向下沟通、跨部门沟通</p>`,
        summary: '提升职场沟通效率的技巧培训材料',
        categoryId: trainingCategory!.id,
        authorId: superAdminUser!.id,
        status: Status.PUBLISHED,
        viewCount: 78,
        attachments: [],
      },
    ];

    const savedDocuments = await documentRepository.save(documents as Document[]);
    console.log(`✅ 成功创建 ${savedDocuments.length} 篇示例文档`);

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 账号信息：');
    console.log('----------------------------------------');
    console.log('超级管理员: superadmin / 123456');
    console.log('HR管理员:   hradmin / 123456');
    console.log('测评管理员: assessmentadmin / 123456');
    console.log('普通员工:   employee / 123456');
    console.log('普通员工:   zhangsan / 123456');
    console.log('普通员工:   lisi / 123456');
    console.log('----------------------------------------');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    await dataSource.destroy();
    process.exit(1);
  }
};

seed();
