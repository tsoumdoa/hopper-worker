import { Hono } from "hono";

const app = new Hono<{
	Bindings: Cloudflare.Env;
}>();

app.post("/", async (c) => {
	const env = c.env;
	const isDev = env.ENVIRONMENT === "development";



	const authToken = c.req.header("authorization");
	if (!authToken) {
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



	return c.json({
		success: true,
		message: "Upload to R2 successfully",
		code: 200,
	});
});


app.get("/:bucket", async (c) => {
	const isDev = c.env.ENVIRONMENT === "development";
	console.log(isDev);
	if (isDev) {
		return c.text("hello from development");

	} else {
		return c.text("hello from production");
	}
})

export default app;
