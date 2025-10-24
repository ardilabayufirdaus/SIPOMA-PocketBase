export interface WhatsAppGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  memberCount: number;
  isActive: boolean;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'video' | 'document' | 'link';
  isDeleted: boolean;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

export interface GroupReport {
  id: string;
  groupId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalMessages: number;
    activeMembers: number;
    topContributors: Array<{
      userId: string;
      name: string;
      messageCount: number;
    }>;
    messageTypes: Record<string, number>;
    engagementRate: number;
  };
  generatedAt: Date;
}
