import { useEffect, useRef } from 'react';
import Markdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import guide from '../guide/guide.md?raw';

// The how-to guide, rendered from src/guide/guide.md
interface HelpOverlayProps {
	onClose: () => void;
}

// Relative image paths in the guide resolve against the deploy base, not the page URL
function resolveSrc(src: string) {
	return /^(?:[a-z]+:|\/)/i.test(src) ? src : import.meta.env.BASE_URL + src;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		dialogRef.current?.showModal();
	}, []);

	return (
		<dialog
			ref={dialogRef}
			className="help"
			onClose={onClose}
			onClick={e => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="help__panel">
				<button className="compare__close help__close" type="button" aria-label="Close" onClick={onClose}>×</button>
				<div className="help__content">
					<Markdown
						remarkPlugins={[remarkGfm]}
						// The guide is our own bundled file, so raw HTML (<small>, <sub>) is trusted
						// rehype-slug gives headings ids ("Spark Filters" → #spark-filters) for in-page links
						rehypePlugins={[rehypeRaw, rehypeSlug]}
						urlTransform={(url, key) => defaultUrlTransform(key === 'src' ? resolveSrc(url) : url)}
						components={{
							a: ({ href, children }) => href?.startsWith('#') ? (
								// Scroll within the dialog without touching the page URL
								<a href={href} onClick={e => {
									e.preventDefault();
									document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ behavior: 'smooth' });
								}}>{children}</a>
							) : (
								// External links would otherwise replace the app
								<a href={href} target="_blank" rel="noreferrer">{children}</a>
							),
						}}
					>
						{guide}
					</Markdown>
				</div>
			</div>
		</dialog>
	);
}

export default HelpOverlay;
