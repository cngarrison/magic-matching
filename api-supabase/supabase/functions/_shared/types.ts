import { SupabaseClient } from '@supabase/supabase-js';

export type SupabaseClientAuthType = 'service' | 'anon' | 'user';

export interface SupabaseClients {
  // client(authType: SupabaseClientAuthType): SupabaseClient | null;
  readonly client: (authType: SupabaseClientAuthType) => SupabaseClient | null;
}

import { Database, Json } from './database.types.ts'


export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]



export type ISO8601String = string;

// Define your interfaces

export interface AuthSession {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	expires_at: number;
}

// export { AuthUser };
export interface AuthUser {
	id: number;
	email: string;
	phone: string;
	password: string;
	user_metadata: object;
	created_at: ISO8601String;
	updated_at: ISO8601String;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface PersonUpdateRequest {
	email: string;
	content: string;
	topic_id: string;
}

// Users
export interface UserRequest {
	email: string;
	password: string;
}

export type User = Tables<'users'>;
// export interface User {
// 	id: number;
// 	email: string;
// 	phone: string;
// 	user_data: object;
// 	created_at: ISO8601String;
// 	updated_at: ISO8601String;
// }

// Organisations
export interface OrgRequest {
	name: string;
	email: string;
	password: string;
	description: string;
	base_url: string;
	logo_url: string;
}

export type OrgMeta = Json;
// export interface OrgMeta {
// 	site_url: string;
// 	webhook_url: string;
// }

export type Org = Tables<'organisations'>;
// export interface Org {
// 	id: number;
// 	name: string;
// 	slug: string;
// 	email: string;
// 	description: string;
// 	org_data: OrgMeta;
// 	created_at: ISO8601String;
// 	updated_at: ISO8601String;
// }

export interface UseRoles {
	use_service_role?: boolean;
	use_user_role?: boolean;
}

export type EmbeddingModel = 'ada_002' | 'gte_small';

export type EmbeddingType = 'person' | 'message';

export type EmbeddingVector = number[];
// export type EmbeddingVector = any[];

export type Embedding = Tables<'embeddings'>;
export interface EmbeddingResult {
	status: string;
	embeddings: Embedding[];
}

export type Person = Tables<'persons'>;
// export interface Person {
// 	id: number;
// 	user_id: number;
// 	name: string;
// 	email: string;
// 	location: string;
// 	bio: string;
// 	person_data: object;
// 	created_at: ISO8601String;
// 	updated_at: ISO8601String;
// }

export type Message = Tables<'messages'>;

// Define your custom error class
export class UserAlreadyExistsError extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'UserAlreadyExistsError';
		this.error = error;
	}
}

export class UserNotFoundError extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'UserNotFoundError';
		this.error = error;
	}
}

export class PersonNotFoundError extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'PersonNotFoundError';
		this.error = error;
	}
}

export class OrgAlreadyExistsError extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'OrgAlreadyExistsError';
		this.error = error;
	}
}

export class OrgNotFoundError extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'OrgNotFoundError';
		this.error = error;
	}
}

export class UrlPathNotHandled extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'UrlPathNotHandled';
		this.error = error;
	}
}

export class SupabaseAuthTypeInvalid extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'SupabaseAuthTypeInvalid';
		this.error = error;
	}
}

export class EmbeddingGenerationError extends Error {
	constructor(message: string, error = {}) {
		super(message);
		this.name = 'EmbeddingGenerationError';
		this.error = error;
	}
}

