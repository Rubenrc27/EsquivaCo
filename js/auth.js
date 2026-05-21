import { supabase } from './supabase-client.js';

export const Auth = {
    // Autenticación Anónima: Ideal para juegos. No requiere email ni password.
    async silentAuth(username) {
        console.log("Iniciando sesión anónima para:", username);
        
        // 1. Entrar de forma anónima
        const { data, error } = await supabase.auth.signInAnonymously({
            options: {
                data: {
                    username: username,
                    display_name: username // Añadimos ambos por si el trigger de Supabase usa otro nombre
                }
            }
        });

        if (error) {
            console.error("Error en entrada anónima:", error.message);
            return { user: null, error: error.message };
        }

        console.log("Entrada anónima exitosa para el ID:", data.user.id);
        
        // Intentamos actualizar el perfil por si el trigger falló
        try {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                username: username,
                updated_at: new Date()
            });
        } catch (e) {
            console.warn("No se pudo actualizar el perfil manualmente, confiando en el trigger.");
        }

        return { user: data.user, error: null };
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem('esquivaco_user');
        window.location.reload();
    }
};
