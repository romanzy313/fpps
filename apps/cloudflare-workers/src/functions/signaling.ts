import { parseApiSignalingRequest, SignalingResponse } from '@fpps/common';
import type { KvStore } from '../kvStore';

type RequestContext = {
	kvStore: KvStore;
};

const signalingKey = (user: string) => `signaling/${user}`;

// will perform signaling using long-polling http
// This needs rate limiting if deployed publically
export async function signaling(reqRaw: unknown, { kvStore }: RequestContext): Promise<SignalingResponse> {
	const req = parseApiSignalingRequest(reqRaw);

	if (req.type === 'message') {
		const { forUser, payloads } = req;
		const outboxKey = signalingKey(forUser);

		console.log('message sent payloads', {
			forUser,
			count: payloads.length,
		});

		const ok = await kvStore.push(outboxKey, payloads, {
			queueMaxSize: 10,
		});
		if (!ok) {
			throw new Error('Failed to push signaling message');
		}
	}

	// read incoming messages
	// assume types are correct for now
	// TODO: can wait for 1 second to wait for a reply
	const { thisUser } = req;

	const inboxKey = signalingKey(thisUser);
	const pendingPayloads = await kvStore.pop<string>(inboxKey);
	if (!pendingPayloads) {
		throw new Error('Failed to read signaling message');
	}

	if (req.type === 'poll') {
		console.log('polling payloads', {
			thisUser,
			count: pendingPayloads.length,
		});
	} else {
		console.log('message read payloads', {
			thisUser,
			count: pendingPayloads.length,
		});
	}

	return {
		payloads: pendingPayloads,
	};
}
