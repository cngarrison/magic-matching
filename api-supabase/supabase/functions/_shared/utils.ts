import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { UseRoles, SupabaseClients, SupabaseClientAuthType, SupabaseAuthTypeInvalid } from './types.ts';
import { Database } from './database.types.ts'



export const getSupabaseClients = (req: Request): SupabaseClients => {
	// const cache: Partial<Record<SupabaseClientAuthType, SupabaseClient>> = {};
	const cache: Record<SupabaseClientAuthType, SupabaseClient | null> = {
		service: null,
		anon: null,
		user: null,
	};

	return {
		get client() {
			return (authType: SupabaseClientAuthType) => {
				if (!cache[authType]) {
					cache[authType] = getSupabaseForAuthType(req, authType);
				}
				return cache[authType];
			};
		},
	};
};

export const getSupabaseForAuthType = (req: Request, authType: SupabaseClientAuthType = 'user'): SupabaseClient => {
	// console.info('getSupabaseForAuthType-authType', authType);

	console.log(`Creating Supabase client for '${authType}' role`);
	let useRoles: UseRoles = {};
	if (authType === 'anon') {
		useRoles = { use_service_role: false, use_user_role: false };
	} else if (authType === 'service') {
		useRoles = { use_service_role: true, use_user_role: false };
	} else if (authType === 'user') {
		useRoles = { use_service_role: false, use_user_role: true };
	} else {
		// Handle unknown authType (should not happen if TypeScript checking is accurate)
		throw new SupabaseAuthTypeInvalid(`Unknown auth type for supabase client: ${authType}`);
	}

	const supabase = getSupabaseClient(req, useRoles);
	return supabase;
};

export const getSupabaseClient = (req: Request, { use_service_role = false, use_user_role = true }: UseRoles = {}): SupabaseClient => {
	// console.info('service_role', use_service_role);
	// console.info('user_role', use_user_role);

	const headers = {};
	if (use_user_role && req.headers.get('Authorization')) {
		headers['Authorization'] = req.headers.get('Authorization');
	}

	const supabase = createClient<Database>(
		Deno.env.get('SUPABASE_URL'),
		Deno.env.get(use_service_role ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY'),
		{
			auth: { persistSession: false, autoRefreshToken: false },
			global: { headers },
		}
	);
	return supabase;
};

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handleFunctionError = (functionName: string, error: Error) => {
	console.error(`Error in function ${functionName}:`, error.name, error.message, error.error);
	if (error?.error?.message) {
		console.error(`Error message ${functionName}:`, error.error.message);
	}
	// Add more logging or alerts here if needed
};

export const handleErrorResponse = (error: Error, err_msg = '--', code = 500, json_body = null) => {
	const msg = `Internal Server Error - ${err_msg}`;
	const body = json_body || { error: msg };
	console.error(`${err_msg}: `, error.message, body);
	return new Response(JSON.stringify(body), {
		status: code,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const generateRandomPassword = (length = 12) => {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const randArr = new Uint8Array(length);
	crypto.getRandomValues(randArr);

	let password = '';
	for (let i = 0; i < length; i++) {
		const index = randArr[i] % charset.length;
		password += charset[index];
	}
	return password;
};

export const convertToSlug = (title: string) => {
	// Step 1: Convert title to lowercase
	let slug = title.toLowerCase();
	// Step 2: Replace non-word characters with hyphen
	slug = slug.replace(/\W/g, '-');
	// Step 3: Remove consecutive hyphens
	slug = slug.replace(/-{2,}/g, '-');
	// Step 4: Trim leading/trailing hyphens
	slug = slug.replace(/^-+|-+$/g, '');
	return slug;
};
