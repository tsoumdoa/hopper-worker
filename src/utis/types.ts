export type Payload = {
	role: string;
	postId: string;
	userId: string;
	size: number;
	iat: number;
	iss: string;
	aud: string;
	exp: number;
	dev: "development" | "production";
}
