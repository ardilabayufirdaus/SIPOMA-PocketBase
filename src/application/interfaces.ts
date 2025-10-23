import { WhatsAppGroup, Message, GroupMember, GroupReport } from '../domain/entities/whatsapp';

export interface IWhatsAppGroupRepository {
  getGroupById(id: string): Promise<WhatsAppGroup | null>;
  getAllGroups(limit?: number, offset?: number): Promise<WhatsAppGroup[]>;
  createGroup(group: Omit<WhatsAppGroup, 'id'>): Promise<WhatsAppGroup>;
  updateGroup(id: string, updates: Partial<WhatsAppGroup>): Promise<WhatsAppGroup>;
  deleteGroup(id: string): Promise<void>;
}

export interface IMessageRepository {
  getMessagesByGroupId(groupId: string, limit?: number): Promise<Message[]>;
  getMessagesByDateRange(groupId: string, startDate: Date, endDate: Date): Promise<Message[]>;
  createMessage(message: Omit<Message, 'id'>): Promise<Message>;
  getMessageStats(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMessages: number;
    messageTypes: Record<string, number>;
    topContributors: Array<{ userId: string; name: string; count: number }>;
  }>;
}

export interface IGroupMemberRepository {
  getMembersByGroupId(groupId: string): Promise<GroupMember[]>;
  addMember(member: Omit<GroupMember, 'id'>): Promise<GroupMember>;
  removeMember(groupId: string, userId: string): Promise<void>;
  updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<GroupMember>;
}

export interface IGroupReportRepository {
  getReportById(id: string): Promise<GroupReport | null>;
  getReportsByGroupId(groupId: string): Promise<GroupReport[]>;
  createReport(report: Omit<GroupReport, 'id'>): Promise<GroupReport>;
  updateReport(id: string, updates: Partial<GroupReport>): Promise<GroupReport>;
  deleteReport(id: string): Promise<void>;
}

