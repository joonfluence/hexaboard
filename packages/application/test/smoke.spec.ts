import 'reflect-metadata';
import { Injectable } from '@nestjs/common';

@Injectable()
class Sample {}

describe('smoke', () => {
  it('imports the ESM-only @nestjs/common and reads decorator metadata', () => {
    expect(Reflect.getMetadata('__injectable__', Sample)).toBe(true);
  });
});
