import { useState } from 'react';
import './UmaFormCSS.css';
import type { UmaFormValues, Grade, UmaType } from '../lib/UmaTypes'
import { emptyValues } from '../lib/UmaTypes'

type GradeGroup = 'track' | 'distance' | 'style'

interface UmaFormProps {
	initialValues?: Partial<UmaFormValues>; // OCR will pass partial pre-filled data here later
	onSave: (values: UmaFormValues) => void;
}


export function UmaForm({ initialValues, onSave }: UmaFormProps) {
	const [values, setValues] = useState<UmaFormValues>({ ...emptyValues, ...initialValues });

	function handleSubmit(e: React.SubmitEvent) { // FormEvent is deprecated
		e.preventDefault();
		onSave(values);
	}

	function renderGradeGroup(group: GradeGroup, title: string, columns: 2 | 4) {
	const grades = values[group] as Record<string, Grade>;

	return (
		<section className="uma-form__section">
			<h2 className="uma-form__heading">{title}</h2>
			<div className={`uma-form__grid uma-form__grid--${columns}`}>
				{Object.keys(grades).map(key => (
					<div key={key} className="uma-form__field">
						<label className="uma-form__label uma-form__label--small">{key}</label>
						<select
							value={grades[key]}
							onChange={e => setValues({ ...values, [group]: { ...grades, [key]: e.target.value } })}
							className="uma-form__select"
						>
							{['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(grade => (
								<option key={grade} value={grade}>{grade}</option>
							))}
						</select>
					</div>
				))}
			</div>
		</section>
	);
}

	return (
		<form onSubmit={handleSubmit} className="uma-form">

			<section className="uma-form__section">
				<h2 className="uma-form__heading">Type</h2>
				<select
					value={values.type}
					onChange={e => setValues({ ...values, type: e.target.value as UmaType })}
					className="uma-form__select"
				>
					<option value="ace">Ace</option>
					<option value="parent">Parent</option>
					<option value="both">Both</option>
				</select>
			</section>

			{/* --- Name --- */} 
			<section className="uma-form__section">
				<h2 className="uma-form__heading">Name</h2>
				<input
					type="text"
					value={values.name}
					onChange={e => setValues({ ...values, name: e.target.value })}
					className="uma-form__input"
					placeholder="e.g. El Condor Pasa"
				/>
			</section>

			{values.type !== 'parent' && (
				<>
					{/* --- Stats --- */}
					<section className="uma-form__section">
						<h2 className="uma-form__heading">Stats</h2>
						<div className="uma-form__grid uma-form__grid--5">
							{(Object.keys(values.stats) as (keyof UmaFormValues['stats'])[]).map(stat => (
								<div key={stat} className="uma-form__field">
									<label className="uma-form__label uma-form__label--small">{stat}</label>
									<input
										type="number"
										value={values.stats[stat]}
										onChange={e => setValues({ ...values, stats: { ...values.stats, [stat]: +e.target.value } })}
										className="uma-form__input uma-form__input--small"
									/>
								</div>
							))}
						</div>
					</section>
						
					{/* --- Aptitudes --- */}
					{renderGradeGroup('track', 'Track', 2)}
					{renderGradeGroup('distance', 'Distance', 4)}
					{renderGradeGroup('style', 'Style', 4)}
						
					{/* --- Skills --- */}
					<section className="uma-form__section">
						<h2 className="uma-form__heading">Skills</h2>
						{/* TODO: searchable/autocomplete list against skillnames.json — placeholder for now */}
						<p className="uma-form__placeholder">Skill entry UI goes here.</p>
					</section>
			
				</>
			)}
			

			{/* --- Sparks --- */}
			<section className="uma-form__section">
				<h2 className="uma-form__heading">Sparks</h2>
				{/* TODO: build spark rows per ancestor (self/parent/grandparent) — placeholder for now */}
				<p className="uma-form__placeholder">Spark entry UI goes here.</p>
			</section>


			<button type="submit" className="uma-form__submit">
				Save Uma
			</button>
		</form>
	);
}