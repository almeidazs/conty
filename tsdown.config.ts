import { defineConfig } from 'tsdown';

export default defineConfig({
	clean: true,
	cwd: process.cwd(),
	deps: {
		neverBundle: true,
	},
	dts: true,
	entry: {
		index: 'src/index.ts',
		fetch: 'src/modules/fetch/index.ts',
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
