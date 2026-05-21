import { supabase } from './supabase-client.js';

export const Auth = {
    // Autenticación Silenciosa: Usa un password interno para que el usuario no tenga que ponerlo
    async silentAuth(username) {
        console.log("Intentando SilentAuth para:", username);
        const virtualEmail = `${username.toLowerCase()}@esquivaco.local`;
        const internalPass = "EsquivaCo_Internal_2026!"; 

        // 1. Intentar Login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password: internalPass,
        });

        if (!signInError) {
            console.log("Login exitoso");
            return { user: signInData.user, error: null };
        }

        // 2. Si el login falla, intentamos registrar
        console.log("Usuario no existe o error, intentando registro...");
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: virtualEmail,
            password: internalPass,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (signUpError) {
            console.error("Error final en Auth:", signUpError.message);
            return { user: null, error: signUpError.message };
        }

        return { user: signUpData.user, error: null };
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
