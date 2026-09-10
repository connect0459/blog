// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'connect0459';
export const SITE_DESCRIPTION = 'Web / モバイル など色々やってます。';

export interface AuthorLink {
	readonly label: string;
	readonly href: string;
}

export const AUTHOR_LINKS: readonly AuthorLink[] = [
	{ label: 'GitHub', href: 'https://github.com/connect0459' },
	{ label: 'Zenn', href: 'https://zenn.dev/connect0459' },
	{ label: 'X', href: 'https://x.com/connect0459' },
];
