// TODO: Implement CORS headers properly
export const corsRouteHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export const corsOptionsHeaders = {
	...corsRouteHeaders,
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
