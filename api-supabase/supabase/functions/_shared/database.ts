import postgres from 'postgres';

import { getSupabaseClients, handleFunctionError, convertToSlug } from './utils.ts';
import config from './config.ts';

import { SupabaseClients, SupabaseClientAuthType, AuthUser, Organisation, Person, User, OrgNotFoundError, UserNotFoundError, UserAlreadyExistsError } from './types.ts';
// // 	EmbeddingVector,
// // 	EmbeddingResult,
// // 	EmbeddingGenerationError,
// // 	PersonNotFoundError,
// // 	OrgNotFoundError,

interface QueryOptions {
	id?: bigint; // Optional; id value (not column name)
	key?: string; // Optional; column name (not value)
	val?: string; // Optional; search value
	table: string;
	columns?: string | string[]; // Optional; can be a string or an array of strings
}

class Database {
	private supabaseClients: SupabaseClients;
	private authType: SupabaseClientAuthType;
	private _authUser: AuthUser;
	private sql;

	constructor(supabaseClients: SupabaseClients, authType: SupabaseClientAuthType = 'service', dbUrl = '') {
		this.supabaseClients = supabaseClients;
		this.authType = authType;
		this.dbUrl = dbUrl || config.db_url;
	}

	public async init() {
		console.log(`Using database with ${this.authType} auth at ${this.dbUrl}`);
		this.sql = postgres(this.dbUrl, {
			// limit to 1 connection so we can do auth setup for it (why isn't there an `on_connect` feature in postgres.js??)
			max: 1,
			// Transform the column names only to camel case
			// (for the results that are returned from the query)
			transform: postgres.toCamel,
			idle_timeout: 20,
			// onnotice: () => {console.log('onnotice')},
			// onparameter: (key, value) => {console.log('onparameter', key, value)},
			// debug: (connection, query, params, types) => {console.log('debug', connection, query, params, types)},
		});

		await this.initializeSession();

		// const originalConnect = this.sql.connect;
		// this.sql.connect = async (...args) => {
		//   console.log('connecting to database - initializing session');
		//   const connection = originalConnect.apply(this.sql, args);
		//   await this.initializeSession();
		//   return connection;
		// };
	}

	public async cleanup() {
		console.log('Database - performing cleanup');
		// ensure edge function is left running with an open connection
		await this.sql.end({ timeout: 5 });
	}

	private async initializeSession() {
		if (this.authType != 'service') {
			console.log('setting auth user');
			await this.setAuthUser();
			if (this._authUser) {			
				console.log('setting claims for RLS');
				const claimStr = JSON.stringify({
					role: 'authenticated',
					sub: this._authUser.id,
					email: this._authUser.email,
				});
				console.log('claimStr', claimStr);
				try {
					// await this.sql.unsafe`
					// 	SELECT 
					// 	  set_config('role', 'authenticated', true),
					// 	  set_config('request.jwt.claims', '${claimStr}'::text, true)`;
					await this.sql`SET SESSION ROLE authenticated`;
					await this.sql.unsafe(`SET request.jwt.claims = '${claimStr}'`);
				} catch (error) {
					handleFunctionError('Database.initializeSession', error);
				}
			} else {
				throw new Error('Failed to set RLS auth - no authUser');
			}
		}
	}


	private supabaseClient(authType: SupabaseClientAuthType) {
		authType ||= this.authTypee;
		return this.supabaseClients.client(authType);
	}

	public setAuthType(authType: SupabaseClientAuthType) {
		this.authType = authType;
	}

	private async getAuthUser(): Promise<AuthUser | null> {
		let authUser;
		try {
			const supabase_user = this.supabaseClient('user');
			const {
				data: { user },
			} = await supabase_user.auth.getUser();
			authUser = user;
		} catch (error) {
			handleFunctionError('Database.getAuthUser', error);
		}
		return authUser;
	}
	private async setAuthUser(authUser: AuthUser | null): Promise<AuthUser | null> {
		this._authUser = authUser || await this.getAuthUser();
		if (!this._authUser) {
			console.log('could not set authUser');
		}
		return this._authUser;
	}
	public async authUser(): Promise<AuthUser | null> {
		let authUser = this._authUser;
		if (!authUser) {
			console.log('getting authUser');
			authUser = await this.getAuthUser();
		}
		return authUser;
	}


	public async checkUserAuth(user: AuthUser, permission: string): Promise<Boolean | null> {
		try {
			const supabase_svc = this.supabaseClient('service');
			const { data, error } = await supabase_svc.rpc('user_has_permission', { auth_id: user.id, requested_permission: permission });
			if (error) throw new Error(`Could not check auth for user ${user.id}: ${error.message}`);
			return data;
		} catch (error) {
			handleFunctionError('checkUserAuth', error);
			return null;
		}
	}


	public async createAuthUser(email: string, password: string, userdata = {}): Promise<User | null> {
		try {
			const supabase_svc = this.supabaseClient('service');
			const { data, error } = await supabase_svc.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				user_metadata: userdata,
			});
			if (error) {
				if (error.message.includes('A user with this email address has already been registered')) {
					throw new UserAlreadyExistsError(`User ${email} is already registered`);
				} else {
					throw new Error(error.message);
				}
			}
			return data.user;
		} catch (error) {
			handleFunctionError('createAuthUser', error);
			return null;
		}
	};

	public async authUserById(userId: string) {
		try {
			const supabase_svc = this.supabaseClient('service');
			const { data, error } = await supabase_svc.auth.admin.getUserById(userId);
			if (error) throw new UserNotFoundError(`User with ID ${userId} not found`);
			return data.user;
		} catch (error) {
			handleFunctionError('authUserById', error);
			return null;
		}
	};

	public async authUserByEmail(email: string): Promise<AuthUser | null> {
		try {
			const supabase_svc = this.supabaseClient('service');
			const { data, error } = await supabase_svc.rpc('get_auth_userid_by_email', { email });
			if (!data || error) throw new UserNotFoundError(`User with email ${email} not found`);
			return await this.authUserById(data);
		} catch (error) {
			handleFunctionError('authUserByEmail', error);
			return null;
		}
	};


	public async selectAll({ table, columns = '*' }: QueryOptions): Promise {
		const columnStr = Array.isArray(columns) ? columns.join(', ') : columns;
		const records =
			columnStr === '*'
				? await this.sql`
					SELECT *
					FROM ${this.sql(table)}`
				: await this.sql`
					SELECT ${this.sql(columnStr)}
					FROM ${this.sql(table)}`;
		return records;
	}

	public async selectBy({ key, val, table, columns = '*' }: QueryOptions): Promise {
		const columnStr = Array.isArray(columns) ? columns.join(', ') : columns;
		const bySql = columnStr === '*'
				? this.sql`
					SELECT *
					FROM ${this.sql(table)}
					WHERE ${this.sql(key)} = ${val}`
				: this.sql`
					SELECT ${this.sql(columnStr)}
					FROM ${this.sql(table)}
					WHERE ${this.sql(key)} = ${val}`;
		const records = await bySql;
		return records?.count > 0 ? 
				records[0] : 
				null;
	}

	public selectById({ id, table, columns = '*' }: QueryOptions): Promise {
		return this.selectBy({ key: 'id', val: id, table, columns });
	}




	public async createOrganisation(name: string, email: string, description: string, org_data: OrgMeta = { site_url: null, webhook_url: null, logo_url: null }): Promise<Organisation | null> {
		// console.log('createOrg-args', {name, email, description, org_data});
		try {
			// if (email && !org_data['email']) {
			//   org_data['email'] = email;
			// }
			const supabase_svc = this.supabaseClient('service');
			const { data, error } = await supabase_svc
				.from('organisations')
				.insert({
					name,
					slug: convertToSlug(name),
					email,
					description,
					org_data,
				})
				.select('id, org_id, name, slug, email, description, org_data, created_at, updated_at')
				.single();
			// console.log('createOrg-data', data);
			// console.error('createOrg-error', error);
			if (error) {
				throw new Error(error);
			}
			return data;
		} catch (error) {
			handleFunctionError('createOrg', error);
			return null;
		}
	};


	public organisations(): Promise<Organisation[] | null> {
		return this.selectAll({ table: 'organisations' });
	}
	public organisation(id: bigint): Promise<Organisation | null> {
		return this.selectById({ id, table: 'organisations' });
	}

	public async organisationBySlug(slug: string): Promise<Organisation | null> {
		try {
			const supabase_svc = this.supabaseClient('service');
			let { data, error } = await supabase_svc.from('organisations').select('*').eq('slug', slug).limit(1).single();
			if (error) {
				if (error.message.includes('multiple (or no) rows returned')) {
					throw new OrgNotFoundError(`Org ${slug} not found`);
				} else {
					throw new Error(error.message);
				}
			}
			return data;
		} catch (error) {
			handleFunctionError('getOrgBySlug', error);
			return null;
		}
	};

	public persons(): Promise<Person[] | null> {
		return this.selectAll({ table: 'persons' });
	}
	public person(id: bigint): Promise<Person | null> {
		return this.selectById({ id, table: 'persons' });
	}
	public personByEmail(email: string): Promise<Person | null> {
		return this.selectBy({ key: 'email', val: email, table: 'persons' });
	}

	public async organisationForPerson(person: Person): Promise<Organisation | null> {
		// console.log('person', person);
		const records = await this.sql`
			SELECT organisations.*
			FROM organisations 
				LEFT JOIN organisation_users ON organisations.id = organisation_users.organisation_id
				LEFT JOIN users ON organisation_users.user_id = users.id
			WHERE users.id = ${person.userId} AND organisation_users.is_primary_org::bool`;
		return Array.isArray(records) && records.length > 0 ? records[0] : records;
	}


	// end class Database
}

export default Database;
