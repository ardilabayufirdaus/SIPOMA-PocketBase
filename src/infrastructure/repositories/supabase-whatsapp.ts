import { SupabaseClient } from '@supabase/supabase-js';
import { WhatsAppGroup, Message, GroupMember, GroupReport } from '../../domain/entities/whatsapp';
import {
  IWhatsAppGroupRepository,
  IMessageRepository,
  IGroupMemberRepository,
  IGroupReportRepository,
} from '../../application/interfaces';

export class SupabaseWhatsAppGroupRepository implements IWhatsAppGroupRepository {
  constructor(private supabase: SupabaseClient) {}

  async getGroupById(id: string): Promise<WhatsAppGroup | null> {
    const { data, error } = await this.supabase
      .from('whatsapp_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      memberCount: data.member_count,
      isActive: data.is_active,
    };
  }

  async getAllGroups(): Promise<WhatsAppGroup[]> {
    const { data, error } = await this.supabase
      .from('whatsapp_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      memberCount: row.member_count,
      isActive: row.is_active,
    }));
  }

  async createGroup(group: Omit<WhatsAppGroup, 'id'>): Promise<WhatsAppGroup> {
    const { data, error } = await this.supabase
      .from('whatsapp_groups')
      .insert({
        name: group.name,
        description: group.description,
        created_at: group.createdAt.toISOString(),
        member_count: group.memberCount,
        is_active: group.isActive,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      memberCount: data.member_count,
      isActive: data.is_active,
    };
  }

  async updateGroup(id: string, updates: Partial<WhatsAppGroup>): Promise<WhatsAppGroup> {
    const updateData: Record<string, string | number | boolean | null> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.memberCount) updateData.member_count = updates.memberCount;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await this.supabase
      .from('whatsapp_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      memberCount: data.member_count,
      isActive: data.is_active,
    };
  }

  async deleteGroup(id: string): Promise<void> {
    const { error } = await this.supabase.from('whatsapp_groups').delete().eq('id', id);

    if (error) throw error;
  }
}

export class SupabaseMessageRepository implements IMessageRepository {
  constructor(private supabase: SupabaseClient) {}

  async getMessagesByGroupId(groupId: string, limit: number = 100): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      groupId: row.group_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      content: row.content,
      timestamp: new Date(row.timestamp),
      messageType: row.message_type,
      isDeleted: row.is_deleted,
    }));
  }

  async getMessagesByDateRange(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('group_id', groupId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      groupId: row.group_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      content: row.content,
      timestamp: new Date(row.timestamp),
      messageType: row.message_type,
      isDeleted: row.is_deleted,
    }));
  }

  async createMessage(message: Omit<Message, 'id'>): Promise<Message> {
    const { data, error } = await this.supabase
      .from('whatsapp_messages')
      .insert({
        group_id: message.groupId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        message_type: message.messageType,
        is_deleted: message.isDeleted,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      groupId: data.group_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      content: data.content,
      timestamp: new Date(data.timestamp),
      messageType: data.message_type,
      isDeleted: data.is_deleted,
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
    const { data, error } = await this.supabase
      .from('whatsapp_messages')
      .select('sender_id, sender_name, message_type')
      .eq('group_id', groupId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .eq('is_deleted', false);

    if (error) throw error;

    const totalMessages = data.length;
    const messageTypes: Record<string, number> = {};
    const contributorMap = new Map<string, { name: string; count: number }>();

    data.forEach((row) => {
      // Count message types
      messageTypes[row.message_type] = (messageTypes[row.message_type] || 0) + 1;

      // Count contributors
      const key = row.sender_id;
      const existing = contributorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        contributorMap.set(key, { name: row.sender_name, count: 1 });
      }
    });

    const topContributors = Array.from(contributorMap.entries())
      .map(([userId, data]) => ({ userId, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalMessages,
      messageTypes,
      topContributors,
    };
  }
}

export class SupabaseGroupMemberRepository implements IGroupMemberRepository {
  constructor(private supabase: SupabaseClient) {}

  async getMembersByGroupId(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await this.supabase
      .from('whatsapp_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      groupId: row.group_id,
      userId: row.user_id,
      name: row.name,
      role: row.role,
      joinedAt: new Date(row.joined_at),
      isActive: row.is_active,
    }));
  }

  async addMember(member: Omit<GroupMember, 'id'>): Promise<GroupMember> {
    const { data, error } = await this.supabase
      .from('whatsapp_group_members')
      .insert({
        group_id: member.groupId,
        user_id: member.userId,
        name: member.name,
        role: member.role,
        joined_at: member.joinedAt.toISOString(),
        is_active: member.isActive,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      groupId: data.group_id,
      userId: data.user_id,
      name: data.name,
      role: data.role,
      joinedAt: new Date(data.joined_at),
      isActive: data.is_active,
    };
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('whatsapp_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<GroupMember> {
    const { data, error } = await this.supabase
      .from('whatsapp_group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      groupId: data.group_id,
      userId: data.user_id,
      name: data.name,
      role: data.role,
      joinedAt: new Date(data.joined_at),
      isActive: data.is_active,
    };
  }
}

export class SupabaseGroupReportRepository implements IGroupReportRepository {
  constructor(private supabase: SupabaseClient) {}

  async getReportById(id: string): Promise<GroupReport | null> {
    const { data, error } = await this.supabase
      .from('whatsapp_group_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      groupId: data.group_id,
      reportType: data.report_type,
      period: {
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
      },
      metrics: data.metrics,
      generatedAt: new Date(data.generated_at),
    };
  }

  async getReportsByGroupId(groupId: string): Promise<GroupReport[]> {
    const { data, error } = await this.supabase
      .from('whatsapp_group_reports')
      .select('*')
      .eq('group_id', groupId)
      .order('generated_at', { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      groupId: row.group_id,
      reportType: row.report_type,
      period: {
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
      },
      metrics: row.metrics,
      generatedAt: new Date(row.generated_at),
    }));
  }

  async createReport(report: Omit<GroupReport, 'id'>): Promise<GroupReport> {
    const { data, error } = await this.supabase
      .from('whatsapp_group_reports')
      .insert({
        group_id: report.groupId,
        report_type: report.reportType,
        start_date: report.period.startDate.toISOString(),
        end_date: report.period.endDate.toISOString(),
        metrics: report.metrics,
        generated_at: report.generatedAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      groupId: data.group_id,
      reportType: data.report_type,
      period: {
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
      },
      metrics: data.metrics,
      generatedAt: new Date(data.generated_at),
    };
  }

  async updateReport(id: string, updates: Partial<GroupReport>): Promise<GroupReport> {
    const updateData: Record<string, string | Date | object | null> = {};
    if (updates.reportType) updateData.report_type = updates.reportType;
    if (updates.period) {
      updateData.start_date = updates.period.startDate.toISOString();
      updateData.end_date = updates.period.endDate.toISOString();
    }
    if (updates.metrics) updateData.metrics = updates.metrics;

    const { data, error } = await this.supabase
      .from('whatsapp_group_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      groupId: data.group_id,
      reportType: data.report_type,
      period: {
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
      },
      metrics: data.metrics,
      generatedAt: new Date(data.generated_at),
    };
  }

  async deleteReport(id: string): Promise<void> {
    const { error } = await this.supabase.from('whatsapp_group_reports').delete().eq('id', id);

    if (error) throw error;
  }
}
