import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EmployeeModule } from '../src/employee/employee.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// import { EmployeeService } from '../src/employee/employee.service';
import { JwtService } from '@nestjs/jwt';
import { EmployeeService } from '../src/employee/employee.service';
import { faker } from '@faker-js/faker';
import { CreateEmployeeDto } from '../src/employee/dto/create-employee.dto';
describe('EmployeeController (e2e)', () => {
  let app: INestApplication;
  // let jwtService: JwtService;
  let employeeService: EmployeeService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot('mongodb://localhost/nest-e2e-testing'),
        EmployeeModule,
      ],
    })
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn().mockReturnValue('mockJwtToken'),
        verify: jest.fn().mockReturnValue({ userId: 'mockUserId' }),
      })
      .compile();
    employeeService = moduleFixture.get<EmployeeService>(EmployeeService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('POST /employees', () => {
    it('should create an employee', async () => {
      const createEmployeeDto = { name: 'Jane Doe', position: 'Manager' };
      const employeeData: CreateEmployeeDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phoneNumber: faker.phone.number(),
        role: faker.person.jobType(),
        password: 'password',
        position: faker.company.buzzNoun(),
      };
      await employeeService.setupAccount(employeeData, faker.database.mongodbObjectId());
      return request(app.getHttpServer())
        .post('/employee/admin/invite-member')
        .send(createEmployeeDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe('Jane Doe');
          expect(res.body.position).toBe('Manager');
        });
    });
  });
});
