import { supabase } from './supabase-client.js';

const MAX_ENTRIES = 10;

export const Leaderboard = {
    async getEntries() {
        const { data, error } = await supabase
            .from('leaderboard')
            .select(`
                score,
                created_at,
                profiles (
                    username
                )
            `)
            .order('score', { ascending: false })
            .limit(MAX_ENTRIES);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }

        return data.map(entry => ({
            score: entry.score,
            username: entry.profiles.username,
            date: new Date(entry.created_at).toLocaleDateString()
        }));
    },

    async getUserBest(userId) {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('score')
            .eq('user_id', userId)
            .order('score', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching user best:', error);
        }

        return data ? data.score : 0;
    },

    async saveEntry(userId, score) {
        // Only save if it's a new record or if you want to keep all attempts.
        // For a simple leaderboard, we can just insert all and the query takes the max.
        const { error } = await supabase
            .from('leaderboard')
            .insert([
                { user_id: userId, score: score }
            ]);

        if (error) {
            console.error('Error saving entry:', error);
        }
    },

    async render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<p class="subtitle">Cargando récords...</p>';

        const entries = await this.getEntries();
        
        if (entries.length === 0) {
            container.innerHTML = '<p class="subtitle">No hay récords aún. ¡Sé el primero!</p>';
            return;
        }

        let html = '<ul class="leaderboard-list">';
        entries.forEach((entry, index) => {
            html += `
                <li class="leaderboard-item">
                    <span>#${index + 1} ${entry.username.toUpperCase()}</span>
                    <span>${entry.score} pts</span>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML = html;
    }
};
