import PocketBase from 'pocketbase';
import { WhatsAppGroup, Message, GroupMember, GroupReport } from '../../domain/entities/whatsapp';
import {
  IWhatsAppGroupRepository,
  IMessageRepository,
  IGroupMemberRepository,
  IGroupReportRepository,
} from '../../application/interfaces';

export class PocketBaseWhatsAppGroupRepository implements IWhatsAppGroupRepository {
  constructor(private pb: PocketBase) {}

  async getGroupById(id: string): Promise<WhatsAppGroup | null> {
    try {
      const record = await this.pb.collection('whatsapp_groups').getOne(id);
      return {
        id: record.id,
        name: record.name,
        description: record.description,
        createdAt: new Date(record.created),
        isActive: record.isActive,
        memberCount: record.memberCount,
      };
    } catch {
      return null;
    }
  }

  async getAllGroups(limit = 50, offset = 0): Promise<WhatsAppGroup[]> {
    const records = await this.pb.collection('whatsapp_groups').getList(offset, limit, {
      sort: '-created',
    });

    return records.items.map((record) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      createdAt: new Date(record.created),
      isActive: record.isActive,
      memberCount: record.memberCount,
    }));
  }

  async createGroup(group: Omit<WhatsAppGroup, 'id'>): Promise<WhatsAppGroup> {
    const record = await this.pb.collection('whatsapp_groups').create({
      name: group.name,
      description: group.description,
      isActive: group.isActive,
      memberCount: group.memberCount || 0,
    });

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      createdAt: new Date(record.created),
      isActive: record.isActive,
      memberCount: record.memberCount,
    };
  }

  async updateGroup(id: string, updates: Partial<WhatsAppGroup>): Promise<WhatsAppGroup> {
    const record = await this.pb.collection('whatsapp_groups').update(id, updates);

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      createdAt: new Date(record.created),
      isActive: record.isActive,
      memberCount: record.memberCount,
    };
  }

  async deleteGroup(id: string): Promise<void> {
    await this.pb.collection('whatsapp_groups').delete(id);
  }
}

export class PocketBaseMessageRepository implements IMessageRepository {
  constructor(private pb: PocketBase) {}

  async getMessagesByGroupId(groupId: string, limit = 50): Promise<Message[]> {
    const records = await this.pb.collection('messages').getList(1, limit, {
      filter: `groupId = "${groupId}"`,
      sort: '-timestamp',
    });

    return records.items.map((record) => ({
      id: record.id,
      groupId: record.groupId,
      senderId: record.senderId,
      senderName: record.senderName,
      content: record.content,
      timestamp: new Date(record.timestamp),
      messageType: record.messageType,
      isDeleted: record.isDeleted,
    }));
  }

  async getMessagesByDateRange(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Message[]> {
    const startTimestamp = startDate.toISOString();
    const endTimestamp = endDate.toISOString();

    const records = await this.pb.collection('messages').getList(1, 1000, {
      filter: `groupId = "${groupId}" && timestamp >= "${startTimestamp}" && timestamp <= "${endTimestamp}"`,
      sort: 'timestamp',
    });

    return records.items.map((record) => ({
      id: record.id,
      groupId: record.groupId,
      senderId: record.senderId,
      senderName: record.senderName,
      content: record.content,
      timestamp: new Date(record.timestamp),
      messageType: record.messageType,
      isDeleted: record.isDeleted,
    }));
  }

  async createMessage(message: Omit<Message, 'id'>): Promise<Message> {
    const record = await this.pb.collection('messages').create({
      groupId: message.groupId,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      messageType: message.messageType,
      isDeleted: message.isDeleted,
    });

    return {
      id: record.id,
      groupId: record.groupId,
      senderId: record.senderId,
      senderName: record.senderName,
      content: record.content,
      timestamp: new Date(record.timestamp),
      messageType: record.messageType,
      isDeleted: record.isDeleted,
    };
  }

  async getMessageStats(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMessages: number;
    messageTypes: Record<string, number>;
    topContributors: Array<{ userId: string; name: string; count: number }>;
  }> {
    // Get messages in date range
    const messages = await this.getMessagesByDateRange(groupId, startDate, endDate);

    // Calculate total messages
    const totalMessages = messages.length;

    // Calculate message types
    const messageTypes: Record<string, number> = {};
    messages.forEach((message) => {
      messageTypes[message.messageType] = (messageTypes[message.messageType] || 0) + 1;
    });

    // Calculate top contributors
    const contributorMap: Record<string, { userId: string; name: string; count: number }> = {};
    messages.forEach((message) => {
      if (!contributorMap[message.senderId]) {
        contributorMap[message.senderId] = {
          userId: message.senderId,
          name: message.senderName,
          count: 0,
        };
      }
      contributorMap[message.senderId].count += 1;
    });

    const topContributors = Object.values(contributorMap).sort((a, b) => b.count - a.count);

    return {
      totalMessages,
      messageTypes,
      topContributors,
    };
  }
}

export class PocketBaseGroupMemberRepository implements IGroupMemberRepository {
  constructor(private pb: PocketBase) {}

  async getMembersByGroupId(groupId: string): Promise<GroupMember[]> {
    const records = await this.pb.collection('group_members').getList(1, 1000, {
      filter: `groupId = "${groupId}"`,
    });

    return records.items.map((record) => ({
      id: record.id,
      groupId: record.groupId,
      userId: record.userId,
      name: record.name,
      role: record.role,
      joinedAt: new Date(record.joinedAt),
      isActive: record.isActive,
    }));
  }

  async addMember(member: Omit<GroupMember, 'id'>): Promise<GroupMember> {
    const record = await this.pb.collection('group_members').create({
      groupId: member.groupId,
      userId: member.userId,
      name: member.name,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      isActive: member.isActive,
    });

    return {
      id: record.id,
      groupId: record.groupId,
      userId: record.userId,
      name: record.name,
      role: record.role,
      joinedAt: new Date(record.joinedAt),
      isActive: record.isActive,
    };
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    // Find the member
    const records = await this.pb.collection('group_members').getList(1, 1, {
      filter: `groupId = "${groupId}" && userId = "${userId}"`,
    });

    if (records.items.length > 0) {
      await this.pb.collection('group_members').delete(records.items[0].id);
    }
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<GroupMember> {
    // Find the member
    const records = await this.pb.collection('group_members').getList(1, 1, {
      filter: `groupId = "${groupId}" && userId = "${userId}"`,
    });

    if (records.items.length === 0) {
      throw new Error('Member not found');
    }

    const member = records.items[0];
    const updatedRecord = await this.pb.collection('group_members').update(member.id, { role });

    return {
      id: updatedRecord.id,
      groupId: updatedRecord.groupId,
      userId: updatedRecord.userId,
      name: updatedRecord.name,
      role: updatedRecord.role,
      joinedAt: new Date(updatedRecord.joinedAt),
      isActive: updatedRecord.isActive,
    };
  }
}

export class PocketBaseGroupReportRepository implements IGroupReportRepository {
  constructor(private pb: PocketBase) {}

  async getReportById(id: string): Promise<GroupReport | null> {
    try {
      const record = await this.pb.collection('group_reports').getOne(id);
      return {
        id: record.id,
        groupId: record.groupId,
        reportType: record.reportType,
        period: {
          startDate: new Date(record.period.startDate),
          endDate: new Date(record.period.endDate),
        },
        metrics: record.metrics,
        generatedAt: new Date(record.generatedAt),
      };
    } catch {
      return null;
    }
  }

  async getReportsByGroupId(groupId: string): Promise<GroupReport[]> {
    const records = await this.pb.collection('group_reports').getList(1, 1000, {
      filter: `groupId = "${groupId}"`,
      sort: '-generatedAt',
    });

    return records.items.map((record) => ({
      id: record.id,
      groupId: record.groupId,
      reportType: record.reportType,
      period: {
        startDate: new Date(record.period.startDate),
        endDate: new Date(record.period.endDate),
      },
      metrics: record.metrics,
      generatedAt: new Date(record.generatedAt),
    }));
  }

  async createReport(report: Omit<GroupReport, 'id'>): Promise<GroupReport> {
    const record = await this.pb.collection('group_reports').create({
      groupId: report.groupId,
      reportType: report.reportType,
      period: {
        startDate: report.period.startDate.toISOString(),
        endDate: report.period.endDate.toISOString(),
      },
      metrics: report.metrics,
      generatedAt: report.generatedAt.toISOString(),
    });

    return {
      id: record.id,
      groupId: record.groupId,
      reportType: record.reportType,
      period: {
        startDate: new Date(record.period.startDate),
        endDate: new Date(record.period.endDate),
      },
      metrics: record.metrics,
      generatedAt: new Date(record.generatedAt),
    };
  }

  async updateReport(id: string, updates: Partial<GroupReport>): Promise<GroupReport> {
    const updateData: Record<string, unknown> = {};

    if (updates.reportType) updateData.reportType = updates.reportType;
    if (updates.period) {
      updateData.period = {
        startDate: updates.period.startDate.toISOString(),
        endDate: updates.period.endDate.toISOString(),
      };
    }
    if (updates.metrics) updateData.metrics = updates.metrics;

    const record = await this.pb.collection('group_reports').update(id, updateData);

    return {
      id: record.id,
      groupId: record.groupId,
      reportType: record.reportType,
      period: {
        startDate: new Date(record.period.startDate),
        endDate: new Date(record.period.endDate),
      },
      metrics: record.metrics,
      generatedAt: new Date(record.generatedAt),
    };
  }

  async deleteReport(id: string): Promise<void> {
    await this.pb.collection('group_reports').delete(id);
  }
}

