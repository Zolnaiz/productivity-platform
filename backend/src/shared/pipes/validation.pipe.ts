import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      excludeExtraneousValues: true,
    });

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
    });

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Баталгаажуулалтын алдаа',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): any[] {
    return errors.map(error => {
      const constraints = error.constraints || {};
      return {
        property: error.property,
        value: error.value,
        constraints: Object.keys(constraints).map(key => ({
          code: key,
          message: constraints[key],
        })),
        children: error.children ? this.formatErrors(error.children) : [],
      };
    });
  }
}