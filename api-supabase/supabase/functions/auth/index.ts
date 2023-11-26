// import 'xhr_polyfill';
import { serve } from 'std/server';

import config from '../_shared/config.ts';
import { getSupabaseClients, corsHeaders, handleErrorResponse } from '../_shared/utils.ts';
import { AuthSession, LoginRequest, UrlPathNotHandled } from '../_shared/types.ts';

serve(async (req: Request) => {
	console.log({ mode: config.mode, req });

	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const url = new URL(req.url);
		if (url.pathname === '/auth/refresh_token') {
			return await refreshToken(req);
		} else if (url.pathname === '/auth/login_with_password') {
			return await loginWithPassword(req);
		} else {
			throw new UrlPathNotHandled(`Invalid path: ${url.pathname}`);
		}
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred with URL routing', 404);
	}
});

const refreshToken = async (req: Request) => {
	let reqSession: AuthSession;
	let authSession: AuthSession;

	try {
		const { session } = await req.json();
		reqSession = session;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred parsing json', 400);
	}
	console.log('reqSession', reqSession);

	const supabaseClients = getSupabaseClients(req);
	const supabase_anon = supabaseClients.client('anon');

	try {
		const { error } = supabase_anon.auth.setSession({
			access_token: reqSession.access_token,
			refresh_token: reqSession.refresh_token,
		});
		if (error) {
			throw new Error(error.message);
		}
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred setting auth session', 401);
	}

	try {
		const { data, error } = await supabase_anon.auth.refreshSession();
		const { session } = data;
		if (error) {
			throw new Error(error.message);
		}
		authSession = session;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred refreshing auth session', 401);
	}

	return new Response(JSON.stringify({ session: authSession }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
};

const loginWithPassword = async (req: Request) => {
	let reqLogin: LoginRequest;
	let authSession: AuthSession;

	try {
		const { login } = await req.json();
		reqLogin = login;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred parsing json', 400);
	}
	console.log('reqLogin', reqLogin);

	const supabase_anon = getSupabase(req, 'anon');

	try {
		// const uint8Array = Uint8Array.from(atob(reqLogin.password), c => c.charCodeAt(0));
		// const decodedPassword = new TextDecoder().decode(uint8Array);

		const { data, error } = await supabase_anon.auth.signInWithPassword({
			email: reqLogin.username,
			password: reqLogin.password,
		});
		// console.log('signInWithPassword: ', data);
		authSession = data.session;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred signing in', 401);
	}

	return new Response(JSON.stringify({ session: authSession }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
};
