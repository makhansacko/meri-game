import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Export statique : se déploie partout (Vercel, Netlify, Cloudflare Pages) et s'emballe avec Capacitor.
			adapter: adapter({ fallback: '404.html' }),
			paths: { relative: true },
			serviceWorker: { register: false },
			// HASH=1 : routage par #/… pour héberger le jeu dans n'importe quel sous-dossier (démo, iframe)
			router: { type: process.env.HASH ? 'hash' : 'pathname' }
		})
	]
});
