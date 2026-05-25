import { supabase } from './supabase-client.js';

export const Auth = {
    // Autenticación Anónima: Permite jugar sin crear cuenta manual
    async silentAuth(username) {
        console.log("Intentando Login Anónimo para:", username);
        
        // 1. Iniciar sesión de forma anónima
        const { data, error } = await supabase.auth.signInAnonymously({
            options: {
                data: {
                    username: username
                }
            }
        });

        if (error) {
            console.error("Error en Auth Anónimo:", error.message);
            return { user: null, error: error.message };
        }

        // 2. Actualizar el perfil con el nombre de usuario
        // Esto es necesario para que el leaderboard pueda mostrar el nombre
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
                id: data.user.id, 
                username: username,
                updated_at: new Date()
            });

        if (profileError) {
            console.warn("No se pudo actualizar el perfil:", profileError.message);
            // No bloqueamos el login si falla el perfil, pero avisamos
        }

        console.log("Login anónimo exitoso");
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
