import {
  Inject,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { TICKET_REPOSITORY } from '@todo/application';
import { MikroOrmTicketRepository } from './mikro-orm-ticket.repository';
import { createOrmConfig, type DatabaseSettings } from './orm.config';

export const MIKRO_ORM = Symbol('MikroORM');

/** ORM 연결과 `TicketRepository` 포트 어댑터를 제공한다. 웹 계층은 이 모듈을 조립만 한다. */
@Module({})
export class PersistenceModule implements OnApplicationShutdown {
  constructor(@Inject(MIKRO_ORM) private readonly orm: MikroORM) {}

  static forRoot(settings: DatabaseSettings): DynamicModule {
    return {
      module: PersistenceModule,
      providers: [
        {
          provide: MIKRO_ORM,
          useFactory: () => MikroORM.init(createOrmConfig(settings)),
        },
        {
          provide: TICKET_REPOSITORY,
          inject: [MIKRO_ORM],
          useFactory: (orm: MikroORM) => new MikroOrmTicketRepository(orm),
        },
      ],
      exports: [MIKRO_ORM, TICKET_REPOSITORY],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.orm.close();
  }
}
