import { supabase } from './supabase-client.js';

const MAX_ENTRIES = 10;

export const Leaderboard = {
    async getEntries() {
        console.log("Cargando récords (Modo Híbrido)...");
        
        // Intentamos cargar de la tabla 'leaderboard'
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
            console.warn('Error al obtener récords:', error.message);
            return [];
        }

        return data.map(entry => ({
            score: entry.score,
            username: (entry.profiles && entry.profiles.username) || "ANÓNIMO",
            date: new Date(entry.created_at).toLocaleDateString()
        }));
    },

    // Nueva función para guardar sin requerir Auth
    async saveScoreByName(username, score) {
        console.log("Guardando récord para:", username, "Puntos:", score);
        
        // IMPORTANTE: Para que esto funcione sin Auth, tu tabla 'leaderboard' 
        // debe tener habilitados los permisos (RLS) para inserts públicos.
        // O podrías intentar una RPC si tienes una función definida.
        
        // Intentamos insertar directamente
        const { error } = await supabase
            .from('leaderboard')
            .insert([
                { 
                    score: score,
                    // Como no tenemos user_id, esto podría fallar si es obligatorio.
                    // Si tienes un trigger que asocie nombres, úsalo aquí.
                }
            ]);

        if (error) {
            console.error('Error al guardar puntuación:', error.message);
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
