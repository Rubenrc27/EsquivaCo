import { supabase } from './supabase-client.js';

const MAX_ENTRIES = 10;

export const Leaderboard = {
    async getEntries() {
        console.log("Cargando récords desde la tabla real...");
        
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
            console.error('Error al obtener récords:', error.message);
            return [];
        }

        return data.map(entry => ({
            score: entry.score,
            username: (entry.profiles && entry.profiles.username) || "DESCONOCIDO",
            date: new Date(entry.created_at).toLocaleDateString()
        }));
    },

    async saveEntry(userId, score) {
        console.log("Guardando récord oficial para ID:", userId, "Puntos:", score);
        
        const { error } = await supabase
            .from('leaderboard')
            .insert([
                { user_id: userId, score: score }
            ]);

        if (error) {
            console.error('Error al guardar récord oficial:', error.message);
        } else {
            console.log("Récord guardado con éxito.");
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
                    <span class="leaderboard-name">#${index + 1} ${entry.username.toUpperCase()}</span>
                    <span class="leaderboard-score">${entry.score} PTS</span>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML = html;
    }
};
