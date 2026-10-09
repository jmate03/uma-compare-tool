// user uploads a screenshot of a uma and it is read with OCR and displayed as JSON
import { useRef, useState } from 'react';
import { getOpenCv, makeWorkers, killWorkers, readUma } from '../ocr/ocr.ts';
import skillnames from '../../data/skillnames_old.json';

export function UmaReader() {
	const imgRef = useRef<HTMLImageElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [result, setResult] = useState<any>(null);
	const [busy, setBusy] = useState(false);

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file || !imgRef.current) return;

		const url = URL.createObjectURL(file);
		imgRef.current.src = url;
		await imgRef.current.decode(); // wait for the image to actually load

		setBusy(true);
		try {
			const cv = await getOpenCv();
			const workers = await makeWorkers();
			try {
				const data = await readUma(cv, workers, imgRef.current, canvasRef.current);
				setResult(data);
			} finally {
				await killWorkers(workers);
			}
		} finally {
			setBusy(false);
			URL.revokeObjectURL(url);
		}
	}

	return (
		<div>
			<input type="file" accept="image/*" onChange={handleFile} disabled={busy} />
			<img ref={imgRef} style={{ display: 'none' }} />
			<canvas ref={canvasRef} style={{ display: 'none' }} />
			{busy && <p>Reading...</p>}
			{result && (
				<pre>{JSON.stringify({ 
					stats: result.stats, 
					aptitudes: result.aptitudes, 
					uniqueLv: result.uniqueLv, 
					skills: result.skills.map((s: any) => s.rawText) // old: candidates.map((id: string) => (skillnames as any)[id]?.[1] ?? `??? (${id})`)) 
				}, null, 2)}</pre>
			)}
		</div>
	);
}