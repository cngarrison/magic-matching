import { env, pipeline } from 'transformers';
import OpenAI from 'openai';

import { SupabaseClients, EmbeddingVector, EmbeddingModel, EmbeddingType, Embedding, EmbeddingResult, EmbeddingGenerationError, Person, Message } from './types.ts';
// import { handleErrorResponse } from './utils.ts';
import config from './config.ts';

// Configuration for Deno runtime
env.useBrowserCache = false;
env.allowLocalModels = false;

export const ingest_embedding = async ({
	supabaseClients,
	model,
	content,
	type,
	record,
}: {
	supabaseClients: SupabaseClients;
	model: EmbeddingModel;
	content: string;
	type: EmbeddingType;
	record: Person | Message;
}): Promise<EmbeddingResult> => {
	let result;
	try {
		console.log(`create embedding for ${type}_${model}`);
		const { embedding_vector, token_count } = await create_embedding({ model, content });
		console.log(`store embedding for ${type}_${model}`);
		const embedding_row = await store_embedding({ supabaseClients, model, embedding_vector, token_count, content, type, record });
		result = { embedding: embedding_row, status: '' };
	} catch (error) {
		// return handleErrorResponse(error, 'An error occurred ingesting embedding');
		return null;
	}
	return result;
};

export const create_embedding = async ({ model, content }: { model: EmbeddingModel; content: string }) => {
	let embedding_vector: EmbeddingVector;
	let token_count: number = 0;

	console.log(`creating embedding for ${model}`);

	if (model === 'gte_small') {
		const pipe_gte_small = await pipeline('feature-extraction', 'Supabase/gte-small');

		const output = await pipe_gte_small(content, {
			pooling: 'mean',
			normalize: true,
		});
		//console.log('Pipe - output', output);

		embedding_vector = Array.from(output.data);
		if (!embedding_vector) {
			throw new EmbeddingGenerationError("Couldn't create embedding for gte_small");
		}
		// console.log('gte_small-Array - embedding', embedding_vector);
	} else if (model === 'ada_002') {
		const openai = new OpenAI({
			apiKey: config.openai_key,
		});

		// OpenAI recommends replacing newlines with spaces for best results
		const input = content.replace(/\n/g, ' ');

		console.log(`creating embedding for ${model} using ${input}`);
		try {
			const embedding_response_openai = await openai.embeddings.create({
				model: 'text-embedding-ada-002',
				input,
			});

			console.log('embedding_response_openai', embedding_response_openai);

			//if (embedding_response_openai.status !== 200) {
			if (!embedding_response_openai.data) {
				//throw new Error(inspect(embedding_response_openai.data, false, 2));
				throw new EmbeddingGenerationError("Couldn't create embedding for ada_002"); // embedding_response_openai.data
			}

			const [embedding_response_data] = embedding_response_openai.data;
			console.log('embedding_response_data', embedding_response_data);

			embedding_vector = embedding_response_data.embedding;
			token_count = embedding_response_openai.usage.total_tokens;
			// console.log('ada_002-Array - embedding', embedding_vector);
		} catch (error) {
			console.error(`Couldn't create embedding for model ada_002: ${error}`);
			throw new EmbeddingGenerationError(`Couldn't create embedding for model ada_002: ${error}`);
		}
	} else {
		throw new EmbeddingGenerationError("Couldn't create embedding - unknown model");
	}

	return { embedding_vector, token_count };
};

export const store_embedding = async ({
	supabaseClients,
	model,
	embedding_vector,
	token_count,
	content,
	type,
	record,
}: {
	supabaseClients: SupabaseClients;
	model: EmbeddingModel;
	embedding_vector: EmbeddingVector;
	token_count: number;
	content: string;
	type: EmbeddingType;
	record: Person | Message;
}) => {
	try {
		// Store the vector in Postgres
		const supabase_user = supabaseClients.client('user');
		const insert_data = {
			content: content,
			token_count: token_count,
			embedding: embedding_vector,
		};
		insert_data[`${type}_id`] = record.id;
		const { data, error } = await supabase_user
			.from(`${type}_embeddings_${model}`)
			.insert(insert_data)
			.select('content, token_count')
			.limit(1)
			.single();
		console.log(`${type}_${model}-Insert embedding - data`, data);
		console.log(`${type}_${model}-Insert embedding - error`, error);
		const embedding_row: Embedding = data;
		return embedding_row;
	} catch (error) {
		// return handleErrorResponse(error, 'An error occurred saving embedding');
		return null;
	}
};
