/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { corsOptionsHeaders, corsRouteHeaders } from './cors';
import { signaling } from './functions';
import { KvStore, KvStoreMemoryRepo } from './kvStore';

const devGlobalKvStore = new KvStore(new KvStoreMemoryRepo());

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'GET' && url.pathname === '/api/health') {
			console.log('Health check OK');
			return new Response('OK', {
				headers: {
					'Content-Type': 'text/plain',
					...corsRouteHeaders,
				},
			});
		} else if (request.method === 'POST' && url.pathname === '/api/signaling') {
			// TODO: all of this needs to be try-catched
			const signalingReq = await request.json(); // TODO: validate me

			const res = await signaling(signalingReq, {
				kvStore: devGlobalKvStore,
			});

			const resJson = JSON.stringify(res);

			return new Response(resJson, {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					...corsRouteHeaders,
				},
			});
		} else if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					...corsOptionsHeaders,
				},
			});
		}

		return new Response(`Unknown request [${request.method}] ${url.pathname}`, {
			status: 404,
		});
	},
} satisfies ExportedHandler<Env>;
