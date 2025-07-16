import { Payload } from "./types";

export function validatePayload(payload: Payload, issuer: string, audience: string) {
const currentTimeInSeconds = Math.floor(Date.now() / 1000);
	if (payload.role !== "user") {
		return false;
	}
	if (payload.exp < currentTimeInSeconds) {
		return false;
	}
	if (payload.iss !== issuer) {
		return false;
	}
	if (payload.aud !== audience) {
		return false;
	}
	if (payload.iat > currentTimeInSeconds) {
		return false;
	}

	return true;
}
