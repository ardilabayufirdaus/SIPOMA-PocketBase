import { GroupReport, Message, GroupMember } from '../entities/whatsapp';
import {
  IMessageRepository,
  IGroupMemberRepository,
  IGroupReportRepository,
} from '../../application/interfaces';

export class GenerateGroupReportUseCase {
  constructor(
    private messageRepo: IMessageRepository,
    private memberRepo: IGroupMemberRepository,
    private reportRepo: IGroupReportRepository
  ) {}

  async execute(groupId: string, reportType: 'daily' | 'weekly' | 'monthly'): Promise<GroupReport> {
    const now = new Date();
    const startDate = this.getStartDate(reportType, now);
    const endDate = now;

    // Get message statistics
    const messageStats = await this.messageRepo.getMessageStats(groupId, startDate, endDate);

    // Get active members
    const members = await this.memberRepo.getMembersByGroupId(groupId);
    const activeMembers = members.filter((m) => m.isActive).length;

    // Calculate engagement rate (messages per active member)
    const engagementRate = activeMembers > 0 ? messageStats.totalMessages / activeMembers : 0;

    const report: Omit<GroupReport, 'id'> = {
      groupId,
      reportType,
      period: { startDate, endDate },
      metrics: {
        totalMessages: messageStats.totalMessages,
        activeMembers,
        topContributors: messageStats.topContributors.slice(0, 10).map((c) => ({
          userId: c.userId,
          name: c.name,
          messageCount: c.count,
        })), // Top 10
        messageTypes: messageStats.messageTypes,
        engagementRate,
      },
      generatedAt: now,
    };

    return await this.reportRepo.createReport(report);
  }

  private getStartDate(reportType: 'daily' | 'weekly' | 'monthly', now: Date): Date {
    const start = new Date(now);
    switch (reportType) {
      case 'daily':
        start.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
    }
    return start;
  }
}

export class GetGroupReportsUseCase {
  constructor(private reportRepo: IGroupReportRepository) {}

  async execute(groupId: string): Promise<GroupReport[]> {
    return await this.reportRepo.getReportsByGroupId(groupId);
  }
}

export class GetGroupAnalyticsUseCase {
  constructor(
    private messageRepo: IMessageRepository,
    private memberRepo: IGroupMemberRepository
  ) {}

  async execute(groupId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const messages = await this.messageRepo.getMessagesByDateRange(groupId, startDate, endDate);
    const members = await this.memberRepo.getMembersByGroupId(groupId);

    // Calculate daily message counts
    const dailyStats = this.calculateDailyStats(messages, startDate, endDate);

    // Calculate member activity
    const memberActivity = this.calculateMemberActivity(messages, members);

    return {
      period: { startDate, endDate },
      totalMessages: messages.length,
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.isActive).length,
      dailyStats,
      memberActivity,
      averageMessagesPerDay: messages.length / days,
    };
  }

  private calculateDailyStats(messages: Message[], startDate: Date, endDate: Date) {
    const stats = new Map<string, number>();
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      stats.set(dateKey, 0);
      current.setDate(current.getDate() + 1);
    }

    messages.forEach((msg) => {
      const dateKey = msg.timestamp.toISOString().split('T')[0];
      stats.set(dateKey, (stats.get(dateKey) || 0) + 1);
    });

    return Array.from(stats.entries()).map(([date, count]) => ({ date, count }));
  }

  private calculateMemberActivity(messages: Message[], members: GroupMember[]) {
    const activity = new Map<string, { name: string; messageCount: number }>();

    members.forEach((member) => {
      activity.set(member.userId, { name: member.name, messageCount: 0 });
    });

    messages.forEach((msg) => {
      const existing = activity.get(msg.senderId);
      if (existing) {
        existing.messageCount++;
      }
    });

    return Array.from(activity.values())
      .filter((a) => a.messageCount > 0)
      .sort((a, b) => b.messageCount - a.messageCount);
  }
}
