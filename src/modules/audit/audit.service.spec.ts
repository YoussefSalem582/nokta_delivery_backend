import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuditService', () => {
  let service: AuditService;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get(AuditService);
    jest.clearAllMocks();
  });

  it('persists audit log entries', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

    await service.log({
      userId: 'admin-1',
      action: 'user.deactivate',
      entityType: 'user',
      entityId: 'user-2',
      metadata: { reason: 'moderation' },
      ipAddress: '127.0.0.1',
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'user.deactivate',
          entityType: 'user',
          entityId: 'user-2',
        }),
      }),
    );
  });
});
