import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { Organization, OrganizationStatus } from '../entities/organization.entity';
import { Questionnaire, QuestionnaireStatus, QuestionnaireType } from '../entities/questionnaire.entity';
import { Response, ResponseStatus } from '../entities/response.entity';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../expenses/entities/expense.entity';
import { Report, ReportStatus, ReportType } from '../entities/report.entity';

@Injectable()
export class DetailedSeedService {
  private readonly logger = new Logger(DetailedSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Questionnaire)
    private readonly questionnaireRepository: Repository<Questionnaire>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async seedAll(): Promise<void> {
    this.logger.log('Seeder эхлэл...');

    try {
      // Эхлээд бүх өгөгдлийг устгах
      await this.clearDatabase();

      // Хэрэглэгчид үүсгэх
      const users = await this.seedUsers();
      
      // Байгууллагууд үүсгэх
      const organizations = await this.seedOrganizations();
      
      // Хэрэглэгчдийг байгууллагад оноох
      await this.assignUsersToOrganizations(users, organizations);

      // Асуулгууд үүсгэх
      const questionnaires = await this.seedQuestionnaires(organizations, users);
      
      // Хариултууд үүсгэх
      await this.seedResponses(questionnaires, users);
      
      // Зардлууд үүсгэх
      await this.seedExpenses(organizations, users);
      
      // Тайлангууд үүсгэх
      await this.seedReports(organizations, users, questionnaires);

      this.logger.log('Seeder амжилттай дууслаа!');
    } catch (error) {
      this.logger.error('Seeder алдаа:', error);
      throw error;
    }
  }

  private async clearDatabase(): Promise<void> {
    this.logger.log('Өгөгдлийн сан цэвэрлэж байна...');
    
    // Дарааллыг анхаарч устгах (foreign key constraint)
    await this.reportRepository.delete({});
    await this.expenseRepository.delete({});
    await this.responseRepository.delete({});
    await this.questionnaireRepository.delete({});
    await this.userRepository.delete({});
    await this.organizationRepository.delete({});
    
    this.logger.log('Өгөгдлийн сан амжилттай цэвэрлэгдлээ');
  }

  private async seedUsers(): Promise<User[]> {
    this.logger.log('Хэрэглэгчид үүсгэж байна...');

    const usersData = [
      // Super Admin
      {
        email: 'superadmin@example.com',
        password: 'Admin@123',
        firstName: 'Супер',
        lastName: 'Админ',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        phone: '99119911',
        emailVerified: true,
      },
      // Админууд
      {
        email: 'admin1@example.com',
        password: 'Admin@123',
        firstName: 'Бадрах',
        lastName: 'Ганбат',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '99229922',
        emailVerified: true,
      },
      {
        email: 'admin2@example.com',
        password: 'Admin@123',
        firstName: 'Энхтайван',
        lastName: 'Баярмаа',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '99339933',
        emailVerified: true,
      },
      // Менежерүүд
      {
        email: 'manager1@example.com',
        password: 'Manager@123',
        firstName: 'Болд',
        lastName: 'Төмөр',
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        phone: '99449944',
        emailVerified: true,
      },
      {
        email: 'manager2@example.com',
        password: 'Manager@123',
        firstName: 'Сүх',
        lastName: 'Батаа',
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        phone: '99559955',
        emailVerified: true,
      },
      // Энгийн хэрэглэгчид
      {
        email: 'user1@example.com',
        password: 'User@123',
        firstName: 'Номин',
        lastName: 'Эрдэнэ',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        phone: '99669966',
        emailVerified: true,
      },
      {
        email: 'user2@example.com',
        password: 'User@123',
        firstName: 'Отгонбаяр',
        lastName: 'Батбаяр',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        phone: '99779977',
        emailVerified: true,
      },
      {
        email: 'user3@example.com',
        password: 'User@123',
        firstName: 'Бат-Эрдэнэ',
        lastName: 'Ганболд',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        phone: '99889988',
        emailVerified: true,
      },
      {
        email: 'user4@example.com',
        password: 'User@123',
        firstName: 'Цэцэг',
        lastName: 'Дорж',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        phone: '99999999',
        emailVerified: true,
      },
      {
        email: 'user5@example.com',
        password: 'User@123',
        firstName: 'Хонгорзул',
        lastName: 'Баттулга',
        role: UserRole.USER,
        status: UserStatus.PENDING,
        phone: '99009900',
        emailVerified: false,
      },
    ];

    const users: User[] = [];
    for (const userData of usersData) {
      const user = this.userRepository.create(userData);
      // Password хешлэх
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(userData.password, salt);
      
      const savedUser = await this.userRepository.save(user);
      users.push(savedUser);
      this.logger.log(`Хэрэглэгч үүсгэгдлээ: ${userData.email}`);
    }

    this.logger.log(`${users.length} хэрэглэгч үүсгэгдлээ`);
    return users;
  }

  private async seedOrganizations(): Promise<Organization[]> {
    this.logger.log('Байгууллагууд үүсгэж байна...');

    const organizationsData = [
      {
        name: 'Технологийн Дээд Сургууль',
        email: 'info@techuniversity.mn',
        phone: '70101010',
        address: 'Улаанбаатар хот, Сүхбаатар дүүрэг, Сөүлийн гудамж 9',
        description: 'Монголын тэргүүлэх технологийн их сургууль',
        taxNumber: '1234567890',
        industry: 'Боловсрол',
        employeeCount: 500,
        contactPersonName: 'Д. Ганбат',
        contactPersonPosition: 'Ректор',
        status: OrganizationStatus.ACTIVE,
        website: 'https://techuniversity.mn',
      },
      {
        name: 'Их Дэлгүүр ХХК',
        email: 'contact@ikhdelguur.mn',
        phone: '70202020',
        address: 'Улаанбаатар хот, Баянгол дүүрэг, Их Дэлгүүрийн гудамж 1',
        description: 'Монголын хамгийн том жижиглэнгийн сүлжээ',
        taxNumber: '0987654321',
        industry: 'Худалдаа',
        employeeCount: 2000,
        contactPersonName: 'Б. Энхбаяр',
        contactPersonPosition: 'Гүйцэтгэх захирал',
        status: OrganizationStatus.ACTIVE,
        website: 'https://ikhdelguur.mn',
      },
      {
        name: 'Монгол Банк',
        email: 'info@mongolbank.mn',
        phone: '70303030',
        address: 'Улаанбаатар хот, Чингэлтэй дүүрэг, Сүхбаатарын талбай 3',
        description: 'Улсын төв банк',
        taxNumber: '1122334455',
        industry: 'Санхүү',
        employeeCount: 800,
        contactPersonName: 'Ж. Батжаргал',
        contactPersonPosition: 'Төлөөлөгч',
        status: OrganizationStatus.ACTIVE,
        website: 'https://mongolbank.mn',
      },
      {
        name: 'Говийн Эрчим Хүч ХХК',
        email: 'info@gobienergy.mn',
        phone: '70404040',
        address: 'Дорноговь аймаг, Сайншанд хот, Эрчим хүчний гудамж 5',
        description: 'Сэргээгдэх эрчим хүчний компани',
        taxNumber: '5544332211',
        industry: 'Эрчим хүч',
        employeeCount: 150,
        contactPersonName: 'Ц. Амарбат',
        contactPersonPosition: 'Удирдах захирал',
        status: OrganizationStatus.ACTIVE,
        website: 'https://gobienergy.mn',
      },
      {
        name: 'Медикал Центр ХХК',
        email: 'info@medicalcenter.mn',
        phone: '70505050',
        address: 'Улаанбаатар хот, Хан-Уул дүүрэг, Эрүүл мэндийн гудамж 12',
        description: 'Орчин үеийн эмнэлгийн төв',
        taxNumber: '6677889900',
        industry: 'Эрүүл мэнд',
        employeeCount: 300,
        contactPersonName: 'Д. Сэржмядаг',
        contactPersonPosition: 'Захирал',
        status: OrganizationStatus.PENDING,
        website: 'https://medicalcenter.mn',
      },
    ];

    const organizations: Organization[] = [];
    for (const orgData of organizationsData) {
      const organization = this.organizationRepository.create(orgData);
      const savedOrg = await this.organizationRepository.save(organization);
      organizations.push(savedOrg);
      this.logger.log(`Байгууллага үүсгэгдлээ: ${orgData.name}`);
    }

    this.logger.log(`${organizations.length} байгууллага үүсгэгдлээ`);
    return organizations;
  }

  private async assignUsersToOrganizations(users: User[], organizations: Organization[]): Promise<void> {
    this.logger.log('Хэрэглэгчдийг байгууллагад оноож байна...');

    // Супер админыг байгууллагад орохгүй үлдээх
    const superAdmin = users.find(u => u.role === UserRole.SUPER_ADMIN);
    
    // Бусад хэрэглэгчдийг байгууллагад оноох
    const otherUsers = users.filter(u => u !== superAdmin);
    
    for (let i = 0; i < otherUsers.length; i++) {
      const user = otherUsers[i];
      const orgIndex = i % organizations.length;
      user.organizationId = organizations[orgIndex].id;
      
      await this.userRepository.save(user);
      this.logger.log(`${user.email} хэрэглэгчийг ${organizations[orgIndex].name} байгууллагад оноов`);
    }
  }

  private async seedQuestionnaires(organizations: Organization[], users: User[]): Promise<Questionnaire[]> {
    this.logger.log('Асуулгууд үүсгэж байна...');

    const questionnairesData = [
      {
        title: 'Ажилчдын сэтгэл ханамжийн судалгаа',
        description: 'Ажилчдын ажлын орчин, удирдлагын талаарх сэтгэл ханамжийг судлах',
        type: QuestionnaireType.SURVEY,
        status: QuestionnaireStatus.PUBLISHED,
        isActive: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        timeLimit: 30,
        questions: [
          {
            id: 'q1',
            text: 'Таны ажлын орчин хэр сэтгэл ханамжтай вэ?',
            type: 'rating',
            required: true,
            minValue: 1,
            maxValue: 5,
            weight: 20,
          },
          {
            id: 'q2',
            text: 'Удирдлага нь таны санал бодлыг сонсдог уу?',
            type: 'single_choice',
            required: true,
            options: ['Тийм, үргэлж', 'Ихэнхдээ', 'Заримдаа', 'Ховор', 'Үгүй'],
            weight: 25,
          },
          {
            id: 'q3',
            text: 'Ажлын ачаалал таны хувьд тохиромжтой юу?',
            type: 'single_choice',
            required: true,
            options: ['Хэт их', 'Бага зэрэг их', 'Тохиромжтой', 'Бага зэрэг бага', 'Хэт бага'],
            weight: 20,
          },
          {
            id: 'q4',
            text: 'Ажлын цагийн уян хатан байдал хэр хангагддаг вэ?',
            type: 'rating',
            required: true,
            minValue: 1,
            maxValue: 5,
            weight: 15,
          },
          {
            id: 'q5',
            text: 'Хөгжлийн боломжууд байгаа эсэх?',
            type: 'single_choice',
            required: true,
            options: ['Олон боломжтой', 'Хангалттай', 'Хангалтгүй', 'Байхгүй'],
            weight: 20,
          },
        ],
        scoring: {
          maxScore: 100,
          passingScore: 70,
          criteria: [
            { questionId: 'q1', weight: 20 },
            { questionId: 'q2', weight: 25 },
            { questionId: 'q3', weight: 20 },
            { questionId: 'q4', weight: 15 },
            { questionId: 'q5', weight: 20 },
          ],
        },
      },
      {
        title: 'Бүтээгдэхүүний чанарын үнэлгээ',
        description: 'Бүтээгдэхүүний чанар, үйлчилгээний талаарх үнэлгээ',
        type: QuestionnaireType.FEEDBACK,
        status: QuestionnaireStatus.PUBLISHED,
        isActive: true,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-12-31'),
        questions: [
          {
            id: 'q1',
            text: 'Бүтээгдэхүүний чанар хэр сэтгэл ханамжтай вэ?',
            type: 'rating',
            required: true,
            minValue: 1,
            maxValue: 10,
            weight: 30,
          },
          {
            id: 'q2',
            text: 'Үйлчилгээний хурд',
            type: 'single_choice',
            required: true,
            options: ['Маш хурдан', 'Хурдан', 'Дунд зэрэг', 'Удаан', 'Маш удаан'],
            weight: 25,
          },
          {
            id: 'q3',
            text: 'Үнийн чанар харьцаа',
            type: 'single_choice',
            required: true,
            options: ['Маш сайн', 'Сайн', 'Дунд зэрэг', 'Муу', 'Маш муу'],
            weight: 25,
          },
          {
            id: 'q4',
            text: 'Дахин худалдан авалт хийх магадлал',
            type: 'rating',
            required: true,
            minValue: 1,
            maxValue: 10,
            weight: 20,
          },
        ],
        scoring: {
          maxScore: 100,
          passingScore: 60,
        },
      },
      {
        title: 'Аюулгүй ажиллагааны мэдлэгийн шалгалт',
        description: 'Аюулгүй ажиллагааны дүрэм журам, мэдлэгийн шалгалт',
        type: QuestionnaireType.QUIZ,
        status: QuestionnaireStatus.PUBLISHED,
        isActive: true,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        timeLimit: 45,
        questions: [
          {
            id: 'q1',
            text: 'Гал унтраагчийг ямар төрлийн галд ашигладаг вэ?',
            type: 'multiple_choice',
            required: true,
            options: ['A төрөл - хатуу материал', 'B төрөл - шатдаг шингэн', 'C төрөл - цахилгаан гал', 'D төрөл - шатдаг металл'],
            weight: 25,
          },
          {
            id: 'q2',
            text: 'Ажлын байранд гэнэтийн осол гарахад юу хийх вэ?',
            type: 'single_choice',
            required: true,
            options: ['Шууд гүйж зайлах', 'Удирдлагад мэдэгдэх', 'Өөрөө шийдвэрлэх', 'Юу ч хийхгүй'],
            weight: 25,
          },
          {
            id: 'q3',
            text: 'Химийн бодистой ажиллахдаа ямар хамгаалалт хэрэглэх вэ?',
            type: 'multiple_choice',
            required: true,
            options: ['Гарын бээлий', 'Нүдний хамгаалалт', 'Амьсгалын хамгаалалт', 'Хийн хувцас'],
            weight: 30,
          },
          {
            id: 'q4',
            text: 'Галын дохиоллын дуугарвал юу хийх вэ?',
            type: 'single_choice',
            required: true,
            options: ['Шууд гаргах', 'Удирдлагад лавлах', 'Өөрөө унтраах', 'Юу ч хийхгүй'],
            weight: 20,
          },
        ],
        scoring: {
          maxScore: 100,
          passingScore: 75,
          criteria: [
            {
              questionId: 'q1',
              weight: 25,
              correctAnswers: ['A төрөл - хатуу материал', 'B төрөл - шатдаг шингэн', 'C төрөл - цахилгаан гал'],
            },
            {
              questionId: 'q2',
              weight: 25,
              correctAnswers: ['Удирдлагад мэдэгдэх'],
            },
            {
              questionId: 'q3',
              weight: 30,
              correctAnswers: ['Гарын бээлий', 'Нүдний хамгаалалт', 'Амьсгалын хамгаалалт'],
            },
            {
              questionId: 'q4',
              weight: 20,
              correctAnswers: ['Шууд гаргах'],
            },
          ],
        },
      },
      {
        title: 'Менежментийн үнэлгээ',
        description: 'Менежерүүдийн ажлын үнэлгээ',
        type: QuestionnaireType.EVALUATION,
        status: QuestionnaireStatus.DRAFT,
        isActive: false,
        questions: [
          {
            id: 'q1',
            text: 'Менежерийн харилцааны чанар',
            type: 'rating',
            required: true,
            minValue: 1,
            maxValue: 10,
          },
          {
            id: 'q2',
            text: 'Шийдвэр гаргах чадвар',
            type: 'rating',
            required: true,
            minValue: 1,
            maxValue: 10,
          },
          {
            id: 'q3',
            text: 'Багийн удирдлага',
            type: 'rating',
            required: true,
            minValue: 1,
            maxValue: 10,
          },
        ],
      },
    ];

    const questionnaires: Questionnaire[] = [];
    const creators = users.filter(u => [UserRole.ADMIN, UserRole.MANAGER].includes(u.role));

    for (let i = 0; i < questionnairesData.length; i++) {
      const qData = questionnairesData[i];
      const orgIndex = i % organizations.length;
      const creatorIndex = i % creators.length;

      const questionnaire = this.questionnaireRepository.create({
        ...qData,
        organizationId: organizations[orgIndex].id,
        createdBy: creators[creatorIndex].id,
        settings: {
          allowAnonymous: false,
          showResults: true,
          requireAuthentication: true,
        },
      });

      const savedQuestionnaire = await this.questionnaireRepository.save(questionnaire);
      questionnaires.push(savedQuestionnaire);
      this.logger.log(`Асуулга үүсгэгдлээ: ${qData.title}`);
    }

    this.logger.log(`${questionnaires.length} асуулга үүсгэгдлээ`);
    return questionnaires;
  }

  private async seedResponses(questionnaires: Questionnaire[], users: User[]): Promise<void> {
    this.logger.log('Хариултууд үүсгэж байна...');

    const regularUsers = users.filter(u => u.role === UserRole.USER);
    let responseCount = 0;

    for (const questionnaire of questionnaires) {
      if (questionnaire.status !== QuestionnaireStatus.PUBLISHED) continue;

      // Асуулга бүрт 3-5 хариулт үүсгэх
      const numResponses = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numResponses; i++) {
        const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
        const shouldSubmit = Math.random() > 0.3; // 70% магадлалтай илгээнэ

        const answers = questionnaire.questions.map((question) => {
          let answer: any;
          
          switch (question.type) {
            case 'rating':
              answer = Math.floor(Math.random() * (question.maxValue! - question.minValue! + 1)) + question.minValue!;
              break;
            case 'single_choice':
              answer = question.options![Math.floor(Math.random() * question.options!.length)];
              break;
            case 'multiple_choice':
              const numSelections = Math.floor(Math.random() * question.options!.length) + 1;
              answer = [];
              const shuffledOptions = [...question.options!].sort(() => Math.random() - 0.5);
              for (let j = 0; j < numSelections; j++) {
                answer.push(shuffledOptions[j]);
              }
              break;
            case 'text':
              answer = `Туршилтын хариулт: ${question.text.substring(0, 20)}...`;
              break;
            case 'scale':
              answer = Math.floor(Math.random() * 10) + 1;
              break;
            default:
              answer = 'Туршилтын хариулт';
          }

          return {
            questionId: question.id,
            answer,
            score: question.weight ? Math.floor(Math.random() * question.weight) + 1 : undefined,
          };
        });

        // Оноо тооцох
        let score: number | undefined;
        let maxScore: number | undefined;
        let percentage: number | undefined;

        if (questionnaire.scoring) {
          maxScore = questionnaire.scoring.maxScore;
          score = Math.floor(Math.random() * maxScore);
          percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        }

        const response = this.responseRepository.create({
          userId: user.id,
          questionnaireId: questionnaire.id,
          organizationId: questionnaire.organizationId,
          answers,
          score,
          maxScore,
          percentage,
          status: shouldSubmit ? ResponseStatus.SUBMITTED : ResponseStatus.IN_PROGRESS,
          submittedAt: shouldSubmit ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
          metadata: {
            device: 'web',
            browser: 'Chrome',
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          },
        });

        await this.responseRepository.save(response);
        responseCount++;

        // Асуулгын статистик шинэчлэх
        if (shouldSubmit) {
          questionnaire.responseCount = (questionnaire.responseCount || 0) + 1;
          
          // Дундаж оноо шинэчлэх
          if (score !== undefined) {
            const currentAvg = questionnaire.averageScore || 0;
            const totalScore = currentAvg * (questionnaire.responseCount - 1) + score;
            questionnaire.averageScore = totalScore / questionnaire.responseCount;
          }
        }
      }

      // Асуулгын мэдээллийг шинэчлэх
      await this.questionnaireRepository.save(questionnaire);
    }

    this.logger.log(`${responseCount} хариулт үүсгэгдлээ`);
  }

  private async seedExpenses(organizations: Organization[], users: User[]): Promise<void> {
    this.logger.log('Зардлууд үүсгэж байна...');

    const expenseCategories = Object.values(ExpenseCategory);
    const expenseStatuses = Object.values(ExpenseStatus);
    const regularUsers = users.filter(u => u.role !== UserRole.SUPER_ADMIN);
    const managers = users.filter(u => u.role === UserRole.MANAGER);
    
    let expenseCount = 0;

    for (const organization of organizations) {
      // Байгууллага бүрт 5-15 зардал үүсгэх
      const numExpenses = Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < numExpenses; i++) {
        const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        const status = expenseStatuses[Math.floor(Math.random() * expenseStatuses.length)];
        const creator = regularUsers[Math.floor(Math.random() * regularUsers.length)];
        const approver = status !== ExpenseStatus.PENDING && Math.random() > 0.5 
          ? managers[Math.floor(Math.random() * managers.length)] 
          : undefined;

        const amount = Math.floor(Math.random() * 5000000) + 100000; // 100,000 - 5,000,000
        const expenseDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        
        const expenseNames: Record<ExpenseCategory, string[]> = {
          [ExpenseCategory.SALARY]: ['Ажилчдын цалин', 'Удирдлагын цалин', 'Нэмэлт цалин'],
          [ExpenseCategory.UTILITY]: ['Цахилгаан төлбөр', 'Усны төлбөр', 'Дулааны төлбөр', 'Харилцаа холбоо'],
          [ExpenseCategory.RENT]: ['Оффисын түрээс', 'Агуулахын түрээс', 'Тоног төхөөрөмжийн түрээс'],
          [ExpenseCategory.OFFICE_SUPPLIES]: ['Бичиг хэрэг', 'Хэвлэх материал', 'Оффисын техник хэрэгсэл'],
          [ExpenseCategory.MARKETING]: ['Сувгийн зар сурталчилгаа', 'Сошиал медиа маркетинг', 'Ивээн тэтгэгчдийн зар'],
          [ExpenseCategory.TRAVEL]: ['Нисэх онгоцны тасалбар', 'Зочид буудал', 'Тээврийн зардал', 'Хоолны зардал'],
          [ExpenseCategory.EQUIPMENT]: ['Компьютер худалдан авалт', 'Оффисын тавилга', 'Үйлдвэрийн тоног төхөөрөмж'],
          [ExpenseCategory.SOFTWARE]: ['Програм хангамжийн лиценз', 'Клауд үйлчилгээ', 'Техникийн дэмжлэг'],
          [ExpenseCategory.TRAINING]: ['Ажилчдын сургалт', 'Семинар оролцоо', 'Мэргэжлийн сургалт'],
          [ExpenseCategory.OTHER]: ['Даатгал', 'Нийгмийн хариуцлага', 'Бусад зардал'],
        };

        const expense = this.expenseRepository.create({
          name: expenseNames[category][Math.floor(Math.random() * expenseNames[category].length)],
          description: `${category} зардлын төлбөр`,
          amount,
          category,
          status,
          expenseDate,
          paidDate: status === ExpenseStatus.PAID 
            ? new Date(expenseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
            : undefined,
          recipientName: `Хүлээн авагч ${i + 1}`,
          recipientAccount: `5000${Math.floor(Math.random() * 1000000000)}`,
          invoiceNumber: `INV-${organization.taxNumber.substring(0, 6)}-${String(i + 1).padStart(4, '0')}`,
          attachments: Math.random() > 0.7 ? ['invoice.pdf', 'receipt.jpg'] : undefined,
          organizationId: organization.id,
          createdBy: creator.id,
          approvedBy: approver?.id,
        });

        await this.expenseRepository.save(expense);
        expenseCount++;
        this.logger.log(`Зардал үүсгэгдлээ: ${expense.name} - ${amount} MNT`);
      }
    }

    this.logger.log(`${expenseCount} зардал үүсгэгдлээ`);
  }

  private async seedReports(organizations: Organization[], users: User[], questionnaires: Questionnaire[]): Promise<void> {
    this.logger.log('Тайлангууд үүсгэж байна...');

    const reportTypes = Object.values(ReportType);
    const managersAndAdmins = users.filter(u => 
      [UserRole.ADMIN, UserRole.MANAGER].includes(u.role)
    );

    let reportCount = 0;

    for (const organization of organizations) {
      // Байгууллага бүрт 2-4 тайлан үүсгэх
      const numReports = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numReports; i++) {
        const type = reportTypes[Math.floor(Math.random() * reportTypes.length)];
        const generatedBy = managersAndAdmins[Math.floor(Math.random() * managersAndAdmins.length)];
        const questionnaire = type === ReportType.QUESTIONNAIRE 
          ? questionnaires[Math.floor(Math.random() * questionnaires.length)]
          : undefined;

        const startDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);

        // Тайлангийн өгөгдөл үүсгэх
        const reportData = await this.generateReportData(type, organization, startDate, endDate, questionnaire);

        const report = this.reportRepository.create({
          type,
          title: `${organization.name} - ${type} тайлан (${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]})`,
          description: `${type} төрлийн тайлангийн дүн шинжилгээ`,
          data: reportData,
          status: ReportStatus.COMPLETED,
          organizationId: organization.id,
          questionnaireId: questionnaire?.id,
          generatedById: generatedBy.id,
          parameters: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            organizationId: organization.id,
            questionnaireId: questionnaire?.id,
          },
          exportedAt: Math.random() > 0.5 ? new Date() : undefined,
          exportFormat: Math.random() > 0.5 ? 'pdf' : undefined,
          exportPath: Math.random() > 0.5 ? `/reports/${organization.id}/${Date.now()}.pdf` : undefined,
        });

        await this.reportRepository.save(report);
        reportCount++;
        this.logger.log(`Тайлан үүсгэгдлээ: ${report.title}`);
      }
    }

    this.logger.log(`${reportCount} тайлан үүсгэгдлээ`);
  }

  private async generateReportData(
    type: ReportType,
    organization: Organization,
    startDate: Date,
    endDate: Date,
    questionnaire?: Questionnaire
  ): Promise<any> {
    switch (type) {
      case ReportType.QUESTIONNAIRE:
        return {
          organization: {
            id: organization.id,
            name: organization.name,
          },
          questionnaire: questionnaire ? {
            id: questionnaire.id,
            title: questionnaire.title,
            questionCount: questionnaire.questions.length,
          } : null,
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          statistics: {
            totalResponses: Math.floor(Math.random() * 500) + 100,
            averageScore: Math.floor(Math.random() * 30) + 60,
            completionRate: Math.floor(Math.random() * 40) + 50,
            responseRate: Math.floor(Math.random() * 30) + 60,
          },
          analysis: {
            strengths: ['Өндөр оролцоо', 'Сэтгэл ханамжтай хариултууд', 'Цаг баримтлалт'],
            weaknesses: ['Зарим асуултууд ойлгомжгүй', 'Хариултын хугацаа удаан'],
            recommendations: ['Асуултуудыг хялбарчлах', 'Урамшууллыг нэмэгдүүлэх'],
          },
        };

      case ReportType.EXPENSE:
        const categories = Object.values(ExpenseCategory);
        const categoryBreakdown: Record<string, { amount: number; percentage: number }> = {};
        let totalAmount = 0;

        categories.forEach(category => {
          const amount = Math.floor(Math.random() * 10000000) + 500000;
          categoryBreakdown[category] = { amount, percentage: 0 };
          totalAmount += amount;
        });

        // Хувь тооцох
        Object.keys(categoryBreakdown).forEach(category => {
          categoryBreakdown[category].percentage = (categoryBreakdown[category].amount / totalAmount) * 100;
        });

        return {
          organization: {
            id: organization.id,
            name: organization.name,
          },
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          financialSummary: {
            totalAmount,
            averageDailyExpense: totalAmount / 30,
            largestExpense: Math.floor(Math.random() * 5000000) + 1000000,
            expenseCount: Math.floor(Math.random() * 50) + 20,
          },
          categoryBreakdown,
          trends: {
            monthly: Array.from({ length: 6 }, (_, i) => ({
              month: `2024-${String(i + 1).padStart(2, '0')}`,
              amount: Math.floor(Math.random() * 20000000) + 5000000,
            })),
            weekly: Array.from({ length: 4 }, (_, i) => ({
              week: `${i + 1}-р долоо хоног`,
              amount: Math.floor(Math.random() * 5000000) + 1000000,
            })),
          },
          recommendations: [
            'Маркетингийн зардлыг бууруулах',
            'Цахилгаан хэрэглээг хэмнэх',
            'Тоног төхөөрөмжийн засвар үйлчилгээг тогтмолжуулах',
          ],
        };

      case ReportType.COMBINED:
        return {
          organization: {
            id: organization.id,
            name: organization.name,
          },
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          questionnairePerformance: {
            totalResponses: Math.floor(Math.random() * 1000) + 500,
            averageScore: Math.floor(Math.random() * 40) + 50,
            topQuestionnaire: questionnaire?.title || 'Ажилчдын сэтгэл ханамжийн судалгаа',
          },
          financialPerformance: {
            totalExpenses: Math.floor(Math.random() * 50000000) + 10000000,
            costPerResponse: Math.floor(Math.random() * 5000) + 1000,
            returnOnInvestment: Math.floor(Math.random() * 200) + 50,
          },
          kpis: {
            engagementScore: Math.floor(Math.random() * 40) + 60,
            efficiencyScore: Math.floor(Math.random() * 30) + 65,
            overallScore: Math.floor(Math.random() * 35) + 65,
            status: ['сайн', 'дунд', 'маш сайн'][Math.floor(Math.random() * 3)],
          },
          strategicRecommendations: [
            'Асуулгын оролцоог 20%-иар нэмэгдүүлэх',
            'Зардлын үр ашгийг 15%-иар сайжруулах',
            'Шинэ технологи нэвтрүүлэх',
          ],
        };

      default:
        return {
          organization: {
            id: organization.id,
            name: organization.name,
          },
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          customData: {
            message: 'Тустай тайлангийн өгөгдөл',
            generatedAt: new Date().toISOString(),
          },
        };
    }
  }

  async getSeedSummary(): Promise<any> {
    const [
      userCount,
      orgCount,
      questionnaireCount,
      responseCount,
      expenseCount,
      reportCount,
    ] = await Promise.all([
      this.userRepository.count(),
      this.organizationRepository.count(),
      this.questionnaireRepository.count(),
      this.responseRepository.count(),
      this.expenseRepository.count(),
      this.reportRepository.count(),
    ]);

    return {
      summary: {
        users: userCount,
        organizations: orgCount,
        questionnaires: questionnaireCount,
        responses: responseCount,
        expenses: expenseCount,
        reports: reportCount,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}