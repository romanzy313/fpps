import { parseApiSignalingRequest } from '@fpps/common';
import type { KvStore } from '../kvStore';

type SignalingRequest =
	| {
			type: 'message';
			thisUser: string; // uuid of the sender
			forUser: string; // uuid of the reciever
			payload: string; // base64 encoded, encrypted signaling payload
	  }
	| { type: 'poll'; thisUser: string };

type RequestContext = {
	kvStore: KvStore;
};

type SignalingResponse = {
	payloads: string[];
};

const signalingKey = (user: string) => `signaling/${user}`;

// will perform signaling using long-polling http
// This needs rate limiting if deployed publically
export async function signaling(reqRaw: unknown, { kvStore }: RequestContext): Promise<SignalingResponse> {
	const req = parseApiSignalingRequest(reqRaw);

	if (req.type === 'message') {
		const { forUser, payload } = req;
		const outboxKey = signalingKey(forUser);

		const ok = await kvStore.push(outboxKey, payload, {
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

	return {
		payloads: pendingPayloads,
	};
}
