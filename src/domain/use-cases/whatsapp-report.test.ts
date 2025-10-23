import { GenerateGroupReportUseCase } from './whatsapp-report';

// Mock repositories
const mockMessageRepo = {
  getMessageStats: jest.fn(),
};

const mockMemberRepo = {
  getMembersByGroupId: jest.fn(),
};

const mockReportRepo = {
  createReport: jest.fn(),
};

describe('GenerateGroupReportUseCase', () => {
  let useCase: GenerateGroupReportUseCase;

  beforeEach(() => {
    useCase = new GenerateGroupReportUseCase(mockMessageRepo, mockMemberRepo, mockReportRepo);
    jest.clearAllMocks();
  });

  it('should generate daily report correctly', async () => {
    const groupId = 'test-group';
    const reportType = 'daily' as const;

    // Mock data
    const mockMessageStats = {
      totalMessages: 100,
      messageTypes: { text: 80, image: 20 },
      topContributors: [
        { userId: 'user1', name: 'User 1', count: 50 },
        { userId: 'user2', name: 'User 2', count: 30 },
      ],
    };

    const mockMembers = [
      {
        id: '1',
        groupId,
        userId: 'user1',
        name: 'User 1',
        role: 'admin' as const,
        joinedAt: new Date(),
        isActive: true,
      },
      {
        id: '2',
        groupId,
        userId: 'user2',
        name: 'User 2',
        role: 'member' as const,
        joinedAt: new Date(),
        isActive: true,
      },
    ];

    const mockReport = {
      id: 'report-1',
      groupId,
      reportType,
      period: { startDate: new Date(), endDate: new Date() },
      metrics: {
        totalMessages: 100,
        activeMembers: 2,
        topContributors: [
          { userId: 'user1', name: 'User 1', messageCount: 50 },
          { userId: 'user2', name: 'User 2', messageCount: 30 },
        ],
        messageTypes: { text: 80, image: 20 },
        engagementRate: 50,
      },
      generatedAt: new Date(),
    };

    mockMessageRepo.getMessageStats.mockResolvedValue(mockMessageStats);
    mockMemberRepo.getMembersByGroupId.mockResolvedValue(mockMembers);
    mockReportRepo.createReport.mockResolvedValue(mockReport);

    const result = await useCase.execute(groupId, reportType);

    expect(mockMessageRepo.getMessageStats).toHaveBeenCalledWith(
      groupId,
      expect.any(Date),
      expect.any(Date)
    );
    expect(mockMemberRepo.getMembersByGroupId).toHaveBeenCalledWith(groupId);
    expect(mockReportRepo.createReport).toHaveBeenCalled();
    expect(result).toEqual(mockReport);
  });

  it('should calculate correct date ranges for different report types', () => {
    const now = new Date('2024-01-15T10:00:00Z');

    // Daily report
    const dailyStart = new Date(now);
    dailyStart.setDate(now.getDate() - 1);
    expect(dailyStart.toISOString().split('T')[0]).toBe('2024-01-14');

    // Weekly report
    const weeklyStart = new Date(now);
    weeklyStart.setDate(now.getDate() - 7);
    expect(weeklyStart.toISOString().split('T')[0]).toBe('2024-01-08');

    // Monthly report
    const monthlyStart = new Date(now);
    monthlyStart.setMonth(now.getMonth() - 1);
    expect(monthlyStart.toISOString().split('T')[0]).toBe('2023-12-15');
  });

  it('should handle empty message stats', async () => {
    const groupId = 'empty-group';
    const reportType = 'daily' as const;

    const mockMessageStats = {
      totalMessages: 0,
      messageTypes: {},
      topContributors: [],
    };

    const mockMembers = [
      {
        id: '1',
        groupId,
        userId: 'user1',
        name: 'User 1',
        role: 'admin' as const,
        joinedAt: new Date(),
        isActive: true,
      },
    ];

    const mockReport = {
      id: 'report-1',
      groupId,
      reportType,
      period: { startDate: new Date(), endDate: new Date() },
      metrics: {
        totalMessages: 0,
        activeMembers: 1,
        topContributors: [],
        messageTypes: {},
        engagementRate: 0,
      },
      generatedAt: new Date(),
    };

    mockMessageRepo.getMessageStats.mockResolvedValue(mockMessageStats);
    mockMemberRepo.getMembersByGroupId.mockResolvedValue(mockMembers);
    mockReportRepo.createReport.mockResolvedValue(mockReport);

    const result = await useCase.execute(groupId, reportType);

    expect(result.metrics.engagementRate).toBe(0);
    expect(result.metrics.topContributors).toEqual([]);
  });
});

