import { supabase } from './supabase-client.js';

export const Auth = {
    async loginOrSignup(username, password) {
        console.log("Intentando login para:", username);
        const virtualEmail = `${username.toLowerCase()}@esquivaco.local`;
        
        // 1. Intentar Login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password: password,
        });

        if (!signInError) {
            console.log("Login exitoso");
            return { user: signInData.user, error: null };
        }

        console.log("Error en login, intentando registro:", signInError.message);

        // 2. Si falla por credenciales inválidas, podría ser que el usuario no existe
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
                console.error("Error en registro:", signUpError.message);
                return { user: null, error: signUpError.message };
            }
            
            console.log("Registro exitoso");
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
