import { defineConfig } from 'tsdown';

const library = defineConfig({
	clean: true,
	cwd: process.cwd(),
	deps: {
		neverBundle: true,
	},
	dts: true,
	entry: {
		index: 'src/index.ts',
		elysia: 'src/modules/elysia/index.ts',
		express: 'src/modules/express/index.ts',
		fastify: 'src/modules/fastify/index.ts',
		fetch: 'src/modules/fetch/index.ts',
		hono: 'src/modules/hono/index.ts',
		next: 'src/modules/next/index.ts',
		rest: 'src/modules/rest/index.ts',
		types: 'src/modules/types/index.ts',
		webhooks: 'src/modules/webhooks/index.ts',
	},
	fixedExtension: false,
	format: ['esm', 'cjs'],
	minify: true,
	platform: 'node',
	sourcemap: false,
	target: 'node20',
	treeshake: true,
	tsconfig: 'tsconfig.build.json',
});

// The CLI is its own bundle: its dependencies (devDependencies, like
// @clack/prompts) are inlined here, so the SDK keeps no runtime dependency.
const cli = defineConfig({
	clean: false,
	cwd: process.cwd(),
	dts: false,
	entry: { cli: 'src/cli/index.ts' },
	fixedExtension: false,
	format: ['esm'],
	minify: true,
	platform: 'node',
	sourcemap: false,
	target: 'node20',
	treeshake: true,
	tsconfig: 'tsconfig.build.json',
});

export default [library, cli].flat();
