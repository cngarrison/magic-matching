// import 'xhr_polyfill';
import { serve } from 'std/server';

import config from '../_shared/config.ts';
import Database from '../_shared/database.ts';
import { getSupabaseClients, corsHeaders, handleErrorResponse, handleFunctionError } from '../_shared/utils.ts';
import { ingest_embedding } from '../_shared/embeddings.ts';
import {
	AuthUser,
	PersonUpdateRequest,
	Person,
	Organisation,
	EmbeddingVector,
	EmbeddingResult,
	UrlPathNotHandled,
	EmbeddingGenerationError,
	PersonNotFoundError,
	OrgNotFoundError,
} from '../_shared/types.ts'; // adjust the path as needed

serve(async (req: Request) => {
	console.log({ mode: config.mode, req });

	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const url = new URL(req.url);
		if (url.pathname === '/persons/summary') {
			return await personSummary(req);
		} else if (url.pathname === '/persons/update_profile') {
			return await updatePersonsProfile(req);
		} else if (url.pathname === '/persons/messages') {
			return await updatePersonsProfile(req);

		} else {
			throw new UrlPathNotHandled(`Invalid path: ${url.pathname}`);
		}
	} catch (error) {
		if (error instanceof UrlPathNotHandled) {
			return handleErrorResponse(error, 'Invalid URL path', 404);
		} else {
			return handleErrorResponse(error, 'An error occurred', 500);
		}
	}
});

const personSummary = async (req: Request) => {
	let reqPersonSummary: PersonUpdateRequest;

	try {
		const { profile } = await req.json();
		reqPersonSummary = profile;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred parsing json', 400);
	}
	console.log('reqPersonSummary', reqPersonSummary);

	const summaryResponse = { summary: {} };

	return new Response(JSON.stringify(summaryResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
};

const updatePersonsProfile = async (req: Request) => {
	const supabaseClients = getSupabaseClients(req);
	const db = new Database(supabaseClients, 'user');
	await db.init();

	let reqPersonUpdate: PersonUpdateRequest;
	let embedding: EmbeddingVector;
	let message: string;

	try {
		const { profile } = await req.json();
		reqPersonUpdate = profile;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred parsing json', 400);
	}
	console.log('reqPersonUpdate', reqPersonUpdate);

	const authUser: AuthUser = await db.authUser();
	if (!authUser) {
		// throw new Error('Failed to get current user');
		return handleErrorResponse(error, 'An error occurred getting auth user', 401);
	}

	const person: Person = await db.personByEmail(authUser.email);
	// console.log('person', person);
	if (!person) {
		//throw new Error('Failed to get person');
		return handleErrorResponse(error, 'An error occurred getting person', 404);
	}

	const organisation: Organisation = await db.organisationForPerson(person);
	// console.log('organisation', organisation);
	if (!organisation) {
		// throw new Error('Failed to get organisation');
		return handleErrorResponse(error, 'An error occurred getting organisation', 404);
	}

	try {
		const allPromises = [
			ingest_embedding({
				supabaseClients,
				model: 'gte_small',
				content: reqPersonUpdate.content,
				type: 'person',
				record: person,
			}),
			ingest_embedding({
				supabaseClients,
				model: 'ada_002',
				content: reqPersonUpdate.content,
				type: 'person',
				record: person,
			}),
		];

		Promise.all(allPromises)
			.then(async (results) => {
				const [embedding_result_gte_small, embedding_result_ada_002] = results;
				console.log('embedding_result_gte_small', embedding_result_gte_small);
				console.log('embedding_result_ada_002', embedding_result_ada_002);

				let embeddingResult: EmbeddingResult | null = {
					status: '',
					embeddings: [embedding_result_gte_small, embedding_result_ada_002],
				};

				// const postData = { result: [embedding_result_gte_small, embedding_result_ada_002], email: authUser.email };
				const postData = { topic_id: reqPersonUpdate.topic_id, content: reqPersonUpdate.content, email: reqPersonUpdate.email };
				console.log('postData', postData);
				const postResponse = await fetch(organisation.orgData.webhookUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(postData),
				});
				const postResult = await postResponse.json();
				console.log('postResult', postResult);
			})
			.catch((error) => {
				return handleErrorResponse(error, 'An error occurred saving embedding', 422);
			});
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred saving embedding', 422);
	}

	await db.cleanup();

	// 	const profileResponse = { update: embeddingResult };
	//
	// 	return new Response(JSON.stringify(profileResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
	return new Response(null, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
};
