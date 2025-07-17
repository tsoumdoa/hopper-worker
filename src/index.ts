import { Hono } from "hono";
import { importSPKI, jwtVerify } from "jose";
import { cors } from 'hono/cors'
import { validatePayload } from "./utis/validate-payload";
import { Payload } from "./utis/types";

type Bindings = Cloudflare.Env & {
	DEV_BUCKET: R2Bucket;
	PROD_BUCKET: R2Bucket;
}


const app = new Hono<{
	Bindings: Bindings;
}>();

app.use(
	'/*',
	cors({
		origin: ["http://localhost:3000", "https://www.hopperclip.com"],
		allowHeaders: ["content-encoding", "content-length", "content-type", "authorization"],
		allowMethods: ['POST'],
		exposeHeaders: ['content-length'],
		maxAge: 30,
		credentials: true,
	})
)

app.post("/", async (c) => {
	const env = c.env;

	const token = c.req.header('Authorization')?.split(' ')[1] ?? "";

	if (!token) {
		return c.json({
			success: false,
			message: "Authorization header is missing.",
			code: 400,
		});
	}


	const contentLength = c.req.header("content-length");
	const bodyArrayBuffer = await c.req.arrayBuffer();
	if (contentLength !== bodyArrayBuffer.byteLength.toString()) {
		return c.json({
			success: false,
			message:
				"Content-Length header does not match the length of the request body.",
			code: 400,
		});
	}


	const secret = env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
	const publicKey = await importSPKI(secret, "RS256");

	try {
		const verified = await jwtVerify(token, publicKey, {
			issuer: env.JWT_ISSUER,
			audience: env.JWT_AUDIENCE,
		});

		const payload = verified.payload as Payload;
		const isValid = validatePayload(payload, env.JWT_ISSUER, env.JWT_AUDIENCE);

		if (!isValid) {
			console.log("received req without valid token");
			return c.json({
				success: false,
				message: "Invalid token",
				code: 400,
			});
		}

		console.log("received req with valid token");
		const bucket = payload.env === "development" ? env.DEV_BUCKET : env.PROD_BUCKET;
		const bucketName = `${payload.userId}/${payload.postId}`;
		console.log("uplaoding to bucket: ", bucketName);
		const blob = await c.req.blob();
		console.log("blob: ", bucket);
		const resBucket = await bucket.put(bucketName, blob);

		if (resBucket?.size !== bodyArrayBuffer.byteLength) {
			return c.json({
				success: false,
				message: "Failed to upload to R2",
				code: 500,
			});
		};

		return c.json({
			success: true,
			message: "Upload to R2 successfully",
			code: 200,
		});
	} catch (e) {
		console.log(e);
		return c.json({
			success: false,
			message: "Invalid token",
			code: 400,
		});
	}

});

export default app;
