import {
  PocketBaseWhatsAppGroupRepository,
  PocketBaseMessageRepository,
  PocketBaseGroupMemberRepository,
  PocketBaseGroupReportRepository,
} from './repositories/pocketbase-whatsapp';
import {
  GenerateGroupReportUseCase,
  GetGroupReportsUseCase,
  GetGroupAnalyticsUseCase,
} from '../domain/use-cases/whatsapp-report';
import { pb } from '../../utils/pocketbase';

class DependencyContainer {
  private _groupRepo: PocketBaseWhatsAppGroupRepository;
  private _messageRepo: PocketBaseMessageRepository;
  private _memberRepo: PocketBaseGroupMemberRepository;
  private _reportRepo: PocketBaseGroupReportRepository;

  constructor() {
    // PocketBase client is already initialized as singleton in utils/pocketbase.ts

    // Initialize repositories
    this._groupRepo = new PocketBaseWhatsAppGroupRepository(pb);
    this._messageRepo = new PocketBaseMessageRepository(pb);
    this._memberRepo = new PocketBaseGroupMemberRepository(pb);
    this._reportRepo = new PocketBaseGroupReportRepository(pb);
  }

  // Repository getters
  get groupRepository() {
    return this._groupRepo;
  }

  get messageRepository() {
    return this._messageRepo;
  }

  get memberRepository() {
    return this._memberRepo;
  }

  get reportRepository() {
    return this._reportRepo;
  }

  // Use case factories
  createGenerateGroupReportUseCase() {
    return new GenerateGroupReportUseCase(this._messageRepo, this._memberRepo, this._reportRepo);
  }

  createGetGroupReportsUseCase() {
    return new GetGroupReportsUseCase(this._reportRepo);
  }

  createGetGroupAnalyticsUseCase() {
    return new GetGroupAnalyticsUseCase(this._messageRepo, this._memberRepo);
  }
}

// Singleton instance
let container: DependencyContainer | null = null;

export const getDependencyContainer = (): DependencyContainer => {
  if (!container) {
    container = new DependencyContainer();
  }
  return container;
};

export type { DependencyContainer };
