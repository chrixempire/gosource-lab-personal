// signup.pipe.ts

import { PipeTransform, Injectable } from '@nestjs/common';
import { EmployeeService } from './employee.service';

@Injectable()
export class EmployeePipe implements PipeTransform<any> {
  constructor(private employeeService: EmployeeService) {}

  async transform(value: any) {
    const authId = value?.businessId ?? value?.id;

    if (!authId) {
      return value;
    }

    const employee = await this.employeeService.getSingleEmployee(
      value.id,
      authId,
    );
    return employee.data;
  }

  private validatePassword(password: string, passwordRepeat: string): boolean {
    return password === passwordRepeat;
  }
}
