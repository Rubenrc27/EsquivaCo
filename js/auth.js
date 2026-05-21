import { supabase } from './supabase-client.js';

export const Auth = {
    async loginOrSignup(username, password) {
        const virtualEmail = `${username.toLowerCase()}@esquivaco.local`;
        
        // 1. Intentar Login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password: password,
        });

        if (!signInError) {
            return { user: signInData.user, error: null };
        }

        // 2. Si falla por credenciales inválidas, podría ser que el usuario no existe
        // Supabase por seguridad a veces devuelve el mismo error si el usuario no existe.
        // Vamos a intentar registrarlo.
        if (signInError.message.includes("Invalid login credentials") || signInError.status === 400) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: virtualEmail,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (signUpError) {
                return { user: null, error: signUpError.message };
            }
            
            return { user: signUpData.user, error: null };
        }

        return { user: null, error: signInError.message };
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async logout() {
        await supabase.auth.signOut();
        window.location.reload();
    }
};
