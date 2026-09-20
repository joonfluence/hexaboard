import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnModuleInit,
} from '@nestjs/common';
import { CreateTicket } from '@todo/application';
import { DatabaseMigrator, PersistenceModule } from '@todo/persistence';
import type { DatabaseSettings } from '@todo/persistence';
import { TicketsController } from './tickets/tickets.controller';

/** 기동 시 마이그레이션을 적용한다. 실패하면 예외가 전파되어 기동이 중단된다(D-72). */
@Injectable()
export class StartupMigration implements OnModuleInit {
  constructor(
    @Inject(DatabaseMigrator) private readonly migrator: DatabaseMigrator,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.migrator.migrate();
  }
}

/** 다른 패키지의 Nest 모듈을 조립해 실행 가능한 앱을 만든다. */
@Module({})
export class AppModule {
  static forRoot(settings: DatabaseSettings): DynamicModule {
    return {
      module: AppModule,
      imports: [PersistenceModule.forRoot(settings)],
      controllers: [TicketsController],
      providers: [StartupMigration, CreateTicket],
    };
  }
}
