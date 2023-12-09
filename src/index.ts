import { RequestHandler } from "express";
import fm from "front-matter";
import { marked } from "marked";
import fs from "node:fs";
import { join, resolve } from "node:path";
import { baseHTML } from "./base.html.js";

const DEFAULT_OPTIONS = {
	strip: true,
	fallthrough: true,
	defaultTitle: "Markdown Document",
};

const resolveFileName = (path: string, strip: boolean) => {
	if (path.at(-1) === "/") {
		return join(path, "index.md");
	}
	return `${path}${strip ? ".md" : ""}`;
};

export const markdown = (
	folder: string,
	options?: Partial<typeof DEFAULT_OPTIONS>,
): RequestHandler => {
	const opts =
		(options && {
			...DEFAULT_OPTIONS,
			...options,
		}) ||
		DEFAULT_OPTIONS;

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

		const fileContent = fs.readFileSync(filepath).toString();
		// @ts-expect-error
		const content = fm<Partial<FrontMatterOptions>>(fileContent);
		const frontMatter = content.attributes;
		const body = content.body;
		const markdownContent = marked.parse(body).toString();
		const title =
			frontMatter.title ??
			markdownContent.match(/<h1>(.*)<\/h1>/)?.[1] ??
			opts.defaultTitle;
		const htmlContent = baseHTML
			.replace("<!--DOCUMENT_TITLE-->", title)
			.replace("<!--DOCUMENT_BODY-->", markdownContent)
			.replace("<!--DOCUMENT_HEAD-->", generateHead(frontMatter));
		res.contentType("html");
		res.send(htmlContent);
	};
};

const generateHead = (opts: Partial<Exclude<FrontMatterOptions, "title">>) => {
	let header = "";
	for (const [key, value] of Object.entries(opts)) {
		switch (key) {
			case "css":
				header += `<link rel="stylesheet" type="text/css" href="${value}" />`;
				break;
			case "favicon":
				header += `<link rel="icon" href="${value}" />`;
				break;
		}
	}
	return header;
};

type FrontMatterOptions = {
	title: string;
	css: string;
	favicon: string;
};
