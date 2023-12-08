import fs from "node:fs";
import { join, resolve } from "node:path";
import { RequestHandler } from "express";
import { marked } from "marked";

const resolveFileName = (path: string, strip: boolean) => {
	if (path.at(-1) === "/") {
		return join(path, "index.md");
	}
	return `${path}${strip ? ".md" : ""}`;
};

export const markdown = (
	folder: string,
	options?: {
		strip?: boolean;
		fallthrough?: boolean;
	},
): RequestHandler => {
	const opts = (options && { strip: true, fallthrough: true, ...options }) || {
		strip: true,
		fallthrough: true,
	};

	return (req, res, next) => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			if (opts.fallthrough) {
				return next();
			}

			res.statusCode = 405;
			res.setHeader("Allow", "GET, HEAD");
			res.setHeader("Content-Length", "0");
			res.end();
			return;
		}

		const filename = resolveFileName(req.path, opts.strip);
		const filepath = join(resolve(folder), filename);
		if (!fs.existsSync(filepath)) {
			if (opts.fallthrough) {
				return next();
			}

			res.statusCode = 404;
			res.end();
			return;
		}

		const markdownContent = marked
			.parse(fs.readFileSync(filepath).toString())
			.toString();
		res.contentType("html");
		res.send(markdownContent);
	};
};
