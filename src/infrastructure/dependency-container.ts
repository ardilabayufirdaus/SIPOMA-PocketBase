import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SupabaseWhatsAppGroupRepository,
  SupabaseMessageRepository,
  SupabaseGroupMemberRepository,
  SupabaseGroupReportRepository,
} from './repositories/supabase-whatsapp';
import {
  GenerateGroupReportUseCase,
  GetGroupReportsUseCase,
  GetGroupAnalyticsUseCase,
} from '../domain/use-cases/whatsapp-report';

class DependencyContainer {
  private supabase: SupabaseClient;
  private _groupRepo: SupabaseWhatsAppGroupRepository;
  private _messageRepo: SupabaseMessageRepository;
  private _memberRepo: SupabaseGroupMemberRepository;
  private _reportRepo: SupabaseGroupReportRepository;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize repositories
    this._groupRepo = new SupabaseWhatsAppGroupRepository(this.supabase);
    this._messageRepo = new SupabaseMessageRepository(this.supabase);
    this._memberRepo = new SupabaseGroupMemberRepository(this.supabase);
    this._reportRepo = new SupabaseGroupReportRepository(this.supabase);
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
