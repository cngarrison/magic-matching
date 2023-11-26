// import 'xhr_polyfill';
import { serve } from 'std/server';

import config from '../_shared/config.ts';
import { getSupabaseClients, corsHeaders, handleErrorResponse, handleFunctionError } from '../_shared/utils.ts';
import { ingest_embedding } from '../_shared/embeddings.ts';
import {
	AuthUser,
	OrgRequest,
	Organisation,
	UrlPathNotHandled,
	OrganisationNotFoundError,
} from '../_shared/types.ts'; // adjust the path as needed

serve(async (req: Request) => {
	console.log({ mode: config.mode, req });

	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const url = new URL(req.url);
		if (url.pathname === '/organisations/summary') {
			return await organisationSummary(req);
		} else {
			throw new UrlPathNotHandled(`Invalid path: ${url.pathname}`);
		}
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred with URL routing', 404);
	}
});

const organisationSummary = async (req: Request) => {
	let reqOrganisationSummary: OrgRequest;

	try {
		const { organisation } = await req.json();
		reqOrganisationSummary = organisation;
	} catch (error) {
		return handleErrorResponse(error, 'An error occurred parsing json', 400);
	}
	console.log('reqOrganisationSummary', reqOrganisationSummary);

    // TODO: 
	const summaryResponse = { summary: {} };

	return new Response(JSON.stringify(summaryResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
};

