
import { getAllUsers } from '../modules/admin/admin.controller';
import { Response } from 'express';

// Mock dependencies
const mockQuery = jest.fn();
jest.mock('../database/db', () => ({
    query: mockQuery
}));

describe('AdminController.getAllUsers', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            query: {},
            user: { userId: 'admin-1', role: 'admin' }
        };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        mockQuery.mockReset();
    });

    it('should return paginated users with role="user"', async () => {
        // Mock DB responses
        // 1. Data query
        mockQuery.mockResolvedValueOnce({
            rows: [
                { id: '1', user_name: 'User 1', role: 'user' },
                { id: '2', user_name: 'User 2', role: 'user' }
            ]
        });
        // 2. Count query
        mockQuery.mockResolvedValueOnce({
            rows: [{ count: '20' }]
        });

        mockReq.query = { page: '1', limit: '10' };

        await getAllUsers(mockReq, mockRes);

        expect(mockQuery).toHaveBeenCalledTimes(2);

        // Check SQL structure
        const sqlArg = mockQuery.mock.calls[0][0];
        expect(sqlArg).toContain("WHERE role = 'user'");
        expect(sqlArg).toContain("LIMIT $1 OFFSET $2"); // Params might vary based on logic, but this is base

        // Verify response
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.any(Array),
            pagination: {
                total: 20,
                page: 1,
                limit: 10,
                totalPages: 2
            }
        }));
    });

    it('should apply search filter', async () => {
        // Mock DB responses
        mockQuery.mockResolvedValue({ // Use resolved value for both if exact order tricky, or use Nth
            rows: [{ count: '5' }] // Simplified mock for count
        });
        mockQuery.mockResolvedValueOnce({
            rows: [{ id: '1', user_name: 'Alice', role: 'user' }]
        });
        mockQuery.mockResolvedValueOnce({
            rows: [{ count: '5' }]
        });


        mockReq.query = { search: 'Alice' };

        await getAllUsers(mockReq, mockRes);

        const sqlArg = mockQuery.mock.calls[0][0];
        const paramsArg = mockQuery.mock.calls[0][1];

        // Ensure search clause is added
        expect(sqlArg).toContain("AND (user_name ILIKE $1 OR email ILIKE $1)");
        expect(paramsArg[0]).toBe('%Alice%');
    });
});
