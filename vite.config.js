import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { fileURLToPath } from "url";
import path from "path";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import viteCompression from "vite-plugin-compression";

const __dirname = path.dirname(
	fileURLToPath(import.meta.url)
);

// Shared Rollup warning handler
const onwarn = (warning, warn) => {
	if (
		warning.code === "EVAL" &&
		warning.id?.includes("js-sha256")
	) {
		return; // Suppress eval warning for known lib
	}
	if (
		warning.code === "SOURCEMAP_ERROR" ||
		warning.message?.includes(
			"points to missing source files"
		)
	) {
		return; // Suppress noisy sourcemap warnings
	}
	warn(warning);
};

// Base PostCSS plugins
const basePostCSS = [autoprefixer()];

export default defineConfig(({ mode }) => {
	const isProduction = mode === "production";

	return {
		plugins: [
			react(),
			nodePolyfills({ protocolImports: true }),
			...(isProduction
				? [
						viteCompression({
							algorithm: "brotliCompress",
						}),
				  ]
				: []),
		],

		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},

		define: {
			global: "globalThis",
		},

		css: {
			postcss: {
				plugins: [
					...basePostCSS,
					...(isProduction
						? [
								cssnano({
									preset: [
										"default",
										{
											discardComments: {
												removeAll: true,
											},
											normalizeWhitespace: true,
										},
									],
								}),
						  ]
						: []),
				],
			},
		},

		build: {
			target: "es2020",
			sourcemap: isProduction ? false : "inline",
			minify: isProduction ? "terser" : "esbuild",

			commonjsOptions: {
				include: [/node_modules/],
				transformMixedEsModules: true,
			},

			chunkSizeWarningLimit: 4000,

			rollupOptions: {
				onwarn,
				output: {
					manualChunks: (id) => {
						if (
							id.includes("react") ||
							id.includes("react-dom")
						) {
							return "react-vendor";
						}
						return null;
					},
					experimentalMinChunkSize: 100_000, // 100KB
					assetFileNames: (assetInfo) => {
						const ext = assetInfo.name
							.split(".")
							.pop();
						if (
							/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(
								ext
							)
						) {
							return `assets/images/[name]-[hash][extname]`;
						}
						return `assets/[name]-[hash][extname]`;
					},
					chunkFileNames:
						"assets/js/[name]-[hash].js",
					entryFileNames:
						"assets/js/[name]-[hash].js",
					generatedCode: {
						arrowFunctions: true,
						constBindings: true,
						objectShorthand: true,
						reservedNamesAsProps: false,
						symbols: true,
					},
				},
			},

			reportCompressedSize: isProduction,
		},

		server: {
			port: 5173,
			host: true,
			allowedHosts: [
				"localhost",
				"127.0.0.1",
				"::1",
				"swap.timesaver2.win",
			],
			sourcemapIgnoreList: (sourcePath) =>
				sourcePath.includes("node_modules"),
		},
	};
});
