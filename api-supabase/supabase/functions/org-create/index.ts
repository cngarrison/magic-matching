import { serve } from 'std/server';

import config from '../_shared/config.ts';
import Database from '../_shared/database.ts';
import { getSupabaseClients, corsHeaders, handleFunctionError, handleErrorResponse, convertToSlug } from '../_shared/utils.ts';
import {
  AuthUser,
  AuthSession,
  ISO8601String,
  UserRequest,
  UserAlreadyExistsError,
  OrgRequest,
  OrgMeta,
  Org,
  OrgNotFoundError
} from '../_shared/types.ts';  // adjust the path as needed


serve(async (req: Request) => {
	console.debug({ mode: config.mode, req });

	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	const supabaseClients = getSupabaseClients(req);

	const db = new Database(supabaseClients, 'service');
	await db.init();


	let reqOrg: OrgRequest;
	let newOrg: Org;
	// 	let newUser: User;
	let authUser: AuthUser;
	let authSession: AuthSession;
	let message: string;

	try {
		const { organisation } = await req.json();
		// const { name, site_url, webhook_url, email, description, logo_url } = organisation;
		reqOrg = organisation;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred parsing json', 400);
	}
	// console.log('reqOrg', reqOrg);

	try {
		newOrg = await db.organisationBySlug(convertToSlug(reqOrg.name));
		if (newOrg) {
			message = `organisation ${reqOrg.name} already exists`;
			return handleErrorResponse({ message }, message, 409);
		} else {
			newOrg = await db.createOrganisation(reqOrg.name, reqOrg.email, reqOrg.description, {
				site_url: reqOrg.site_url,
				webhook_url: reqOrg.webhook_url,
				logo_url: reqOrg.logo_url,
			});
			message = `created organisation ${newOrg.name}`;
			if (!newOrg) {
				throw new Error('Failed to create organisation');
			}
			const userdata = { organisation_id: newOrg.org_id };
			const user: AuthUser = await db.createAuthUser(reqOrg.email, reqOrg.password, userdata);
			if (!user) {
				throw new Error('Failed to create user');
			}
		}
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred loading or creating new organisation', 422);
	}

	try {
		const supabase = supabaseClients.client('service');
		const { data, error } = await supabase.auth.signInWithPassword({
			email: reqOrg.email,
			password: reqOrg.password,
		});
		// console.log('signInWithPassword: ', data);
		authUser = data.user;
		authSession = data.session;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred signing in', 401);
	}

	await db.cleanup();

	const uint8Array = new TextEncoder().encode(reqOrg.password);
	const encodedPass = btoa(String.fromCharCode.apply(null, uint8Array)); // b64 encoding provides *no* security, just cheap way to hide from casual viewing
	const newOrgResponse = {
		message,
		organisation: {
			id: newOrg.id,
			name: newOrg.name,
			slug: newOrg.slug,
			email: newOrg.email,
			description: newOrg.description,
			org_data: newOrg.org_data,
			created_at: newOrg.created_at,
			updated_at: newOrg.updated_at,
		},
		user: {
			id: authUser.id,
			username: authUser.email,
			password: encodedPass,
			email: authUser.email,
			phone: authUser.phone,
			//user_data: authUser.user_metadata,
			created_at: authUser.created_at,
			updated_at: authUser.updated_at,
		},
		session: {
			access_token: authSession.access_token,
			token_type: authSession.token_type,
			expires_in: authSession.expires_in,
			refresh_token: authSession.refresh_token,
			expires_at: authSession.expires_at,
		},
	};
	console.info('newOrgResponse', newOrgResponse);
	return new Response(JSON.stringify(newOrgResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

