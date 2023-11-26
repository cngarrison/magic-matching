// import 'xhr_polyfill';
import { serve } from 'std/server';

import config from '../_shared/config.ts';
import Database from '../_shared/database.ts';
import { getSupabaseClients, corsHeaders, handleErrorResponse } from '../_shared/utils.ts';
import {
  AuthUser,
  AuthSession,
  UserRequest,
} from '../_shared/types.ts';  // adjust the path as needed


serve(async (req: Request) => {
	console.log({ mode: config.mode, req });

	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

// 	const url = new URL(req.url);
// 	if (url.pathname === '/users/refresh_token') {
// 		return await refreshToken(req);
// 	} else if (url.pathname === '/users/login_with_password') {
// 		return await loginWithPassword(req);
// 	} else {
		return await createUserAuth(req);
// 	}

});

const createUserAuth = async (req: Request) => {
	const supabaseClients = getSupabaseClients(req);

	const db = new Database(supabaseClients, 'user');
	await db.init();

	let reqUser: UserRequest;
	let newUser: AuthUser;
	let authSession: AuthSession;
	let message: string;

	try {
		const { user } = await req.json();
		reqUser = user;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred parsing json', 400);
	}
	console.log('reqUser', reqUser);

	try {
		let authUser = await db.authUserByEmail(reqUser.email);
		if (authUser) {
			message = `using existing authUser ${authUser.email}`;
		} else {
			const currentAuthUser = await db.authUser();
			console.log('currentAuthUser', currentAuthUser);
			// create new user in same org as current authUser
			const userdata = { organisation_id: currentAuthUser.user_metadata['organisation_id'] };
			authUser = await db.createAuthUser(reqUser.email, reqUser.password, userdata);
			if (authUser) {
				message = `created authUser ${authUser.email}`;
			} else {
				message = `failed to create authUser ${reqUser.email}`;
				throw new Error('Failed to create authUser');
			}
		}
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred loading or creating new authUser', 422);
	}

	try {
		const supabase_user = supabaseClients.client('user');
		const { data, error } = await supabase_user.auth.signInWithPassword({
			email: reqUser.email,
			password: reqUser.password,
		});
		if (error) { throw new Error(error.message); }
		newUser = data.user;
		authSession = data.session;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred signing in', 401);
	}

	await db.cleanup();

	const uint8Array = new TextEncoder().encode(reqUser.password);
	const encodedPass = btoa(String.fromCharCode.apply(null, uint8Array)); // b64 encoding provides *no* security, just cheap way to hide from casual viewing
	const newUserResponse = {
		message,
		user: {
			id: newUser.id,
			username: newUser.email,
			password: encodedPass,
			email: newUser.email,
			phone: newUser.phone,
			//user_data: newUser.user_metadata,
			created_at: newUser.created_at,
			updated_at: newUser.updated_at,
		},
		session: {
			access_token: authSession.access_token,
			token_type: authSession.token_type,
			expires_in: authSession.expires_in,
			refresh_token: authSession.refresh_token,
			expires_at: authSession.expires_at,
		},
	};

	return new Response(JSON.stringify(newUserResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

};


