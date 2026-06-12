
import { query } from '../../database/db';

export class UserService {
    async getUserById(id: string) {
        const text = 'SELECT id, email, phone, user_name, role, status, created_at FROM users WHERE id = $1';
        const result = await query(text, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }
}
