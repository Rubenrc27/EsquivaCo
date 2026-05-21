const LEADERBOARD_KEY = 'esquivaco_leaderboard';
const MAX_ENTRIES = 10;

export const Leaderboard = {
    getEntries() {
        const stored = localStorage.getItem(LEADERBOARD_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    saveEntry(score) {
        let entries = this.getEntries();
        const date = new Date().toLocaleDateString();
        
        entries.push({ score, date });
        entries.sort((a, b) => b.score - a.score);
        entries = entries.slice(0, MAX_ENTRIES);
        
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
        return entries;
    },

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = this.getEntries();
        if (entries.length === 0) {
            container.innerHTML = '<p class="subtitle">No hay récords aún. ¡Sé el primero!</p>';
            return;
        }

        let html = '<ul class="leaderboard-list">';
        entries.forEach((entry, index) => {
            html += `
                <li class="leaderboard-item">
                    <span>#${index + 1}</span>
                    <span>${entry.score} pts</span>
                    <span style="font-size: 0.8rem; opacity: 0.5;">${entry.date}</span>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML = html;
    }
};
