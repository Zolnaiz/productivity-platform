import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Баталгаажуулах функцүүд
 */

// Нийлбэр нь 100 байх ёстой
@ValidatorConstraint({ name: 'sumIs100', async: false })
export class SumIs100Constraint implements ValidatorConstraintInterface {
  validate(values: number[], args: ValidationArguments) {
    if (!Array.isArray(values)) return false;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.abs(sum - 100) < 0.01; // Төгсгөлийн алдаа
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} нийлбэр нь 100 байх ёстой`;
  }
}

export function SumIs100(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SumIs100Constraint,
    });
  };
}

// Нийлбэр нь 1 байх ёстой (хувь хэмжээ)
@ValidatorConstraint({ name: 'sumIs1', async: false })
export class SumIs1Constraint implements ValidatorConstraintInterface {
  validate(values: number[], args: ValidationArguments) {
    if (!Array.isArray(values)) return false;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.abs(sum - 1) < 0.0001; // Төгсгөлийн алдаа
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} нийлбэр нь 1 байх ёстой`;
  }
}

export function SumIs1(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SumIs1Constraint,
    });
  };
}

// Өнөөдрөөс өмнөх огноо
@ValidatorConstraint({ name: 'isPastDate', async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date | string, args: ValidationArguments) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} өнөөдрөөс өмнөх огноо байх ёстой`;
  }
}

export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPastDateConstraint,
    });
  };
}

// Өнөөдрөөс хойш огноо
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date | string, args: ValidationArguments) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} өнөөдрөөс хойш огноо байх ёстой`;
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

// Хязгаарт байх огноо
@ValidatorConstraint({ name: 'isDateInRange', async: false })
export class IsDateInRangeConstraint implements ValidatorConstraintInterface {
  validate(date: Date | string, args: ValidationArguments) {
    const [minDate, maxDate] = args.constraints;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const min = minDate ? new Date(minDate) : new Date('1900-01-01');
    const max = maxDate ? new Date(maxDate) : new Date('2100-12-31');
    
    return dateObj >= min && dateObj <= max;
  }

  defaultMessage(args: ValidationArguments) {
    const [minDate, maxDate] = args.constraints;
    return `${args.property} ${minDate} - ${maxDate} хооронд байх ёстой`;
  }
}

export function IsDateInRange(minDate?: string, maxDate?: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minDate, maxDate],
      validator: IsDateInRangeConstraint,
    });
  };
}

// Мөнгөн дүн шалгах
@ValidatorConstraint({ name: 'isValidAmount', async: false })
export class IsValidAmountConstraint implements ValidatorConstraintInterface {
  validate(amount: number, args: ValidationArguments) {
    if (typeof amount !== 'number') return false;
    if (amount < 0) return false;
    if (amount > 1000000000000) return false; // 1 их наяд
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} 0-ээс их, 1 их наяд-аас бага байх ёстой`;
  }
}

export function IsValidAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAmountConstraint,
    });
  };
}

// Массив нь хоосон биш байх
@ValidatorConstraint({ name: 'arrayNotEmpty', async: false })
export class ArrayNotEmptyConstraint implements ValidatorConstraintInterface {
  validate(array: any[], args: ValidationArguments) {
    return Array.isArray(array) && array.length > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} хоосон байж болохгүй`;
  }
}

export function ArrayNotEmpty(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ArrayNotEmptyConstraint,
    });
  };
}

// Утгууд өөр өөр байх
@ValidatorConstraint({ name: 'isUniqueArray', async: false })
export class IsUniqueArrayConstraint implements ValidatorConstraintInterface {
  validate(array: any[], args: ValidationArguments) {
    if (!Array.isArray(array)) return false;
    const unique = new Set(array);
    return unique.size === array.length;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} дахь утгууд өөр өөр байх ёстой`;
  }
}

export function IsUniqueArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueArrayConstraint,
    });
  };
}

// JSON объект шалгах
@ValidatorConstraint({ name: 'isValidJSON', async: false })
export class IsValidJSONConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value === 'object' && value !== null) return true;
    
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} хүчинтэй JSON байх ёстой`;
  }
}

export function IsValidJSON(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidJSONConstraint,
    });
  };
}

// Файлын нэр шалгах
@ValidatorConstraint({ name: 'isValidFileName', async: false })
export class IsValidFileNameConstraint implements ValidatorConstraintInterface {
  validate(filename: string, args: ValidationArguments) {
    if (typeof filename !== 'string') return false;
    
    // Хориглосон тэмдэгтүүд
    const forbiddenChars = /[<>:"/\\|?*\x00-\x1F]/;
    if (forbiddenChars.test(filename)) return false;
    
    // Тухайн нэрс
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
    ];
    const nameWithoutExt = filename.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) return false;
    
    // Урт шалгах
    if (filename.length > 255) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} хүчинтэй файлын нэр байх ёстой`;
  }
}

export function IsValidFileName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidFileNameConstraint,
    });
  };
}

// URL шалгах
@ValidatorConstraint({ name: 'isValidUrl', async: false })
export class IsValidUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} хүчинтэй URL байх ёстой (http эсвэл https)`;
  }
}

export function IsValidUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUrlConstraint,
    });
  };
}

// Бүх утгууд boolean байх
@ValidatorConstraint({ name: 'allValuesBoolean', async: false })
export class AllValuesBooleanConstraint implements ValidatorConstraintInterface {
  validate(obj: Record<string, any>, args: ValidationArguments) {
    if (typeof obj !== 'object' || obj === null) return false;
    
    return Object.values(obj).every(value => typeof value === 'boolean');
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} дахь бүх утгууд boolean байх ёстой`;
  }
}

export function AllValuesBoolean(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: AllValuesBooleanConstraint,
    });
  };
}