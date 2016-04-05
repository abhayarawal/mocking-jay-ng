import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {LayoutHeader} from '../layouts/header.layout';
import {Segment, Time} from '../interfaces/interface';

import {RadiusInputComponent, RadiusSelectComponent, RadiusRadioComponent, SelectObject} from '../form/form.component';


@Component({
	selector: 'mj-radio',
	template: `
		<div class="mj__radio__wrap" (click)="toggle()">
			<span class="mj__radio" [ngClass]="{on: on}">
				&nbsp;
			</span>
			<span class="mj__radio__text" *ngIf="text">{{text}}</span>
		</div>
	`
})
export class MjRadio {
	@Input() on: boolean = false;
	@Input() text: string;
	@Output() update = new EventEmitter<boolean>();

	toggle() {
		this.on = !!!this.on;
		this.update.next(this.on);
	}
}

@Component({
	selector: 'mj-number',
	template: `
		<div class="mj__number">
			<input type="text" [(ngModel)]="val" (ngModelChange)="emitValue()" />
			<div class="button__wrap">
				<button (click)="down()">
					<span class="lnr lnr-chevron-down"></span>
				</button>
				<button (click)="up()">
					<span class="lnr lnr-chevron-up"></span>
				</button>
			</div>
		</div>
	`
})
export class MjNumber {
	@Input() val: number;
	@Input() min: number;
	@Input() max: number;
	@Output() update = new EventEmitter<string>();

	emitValue() {
	}

	down() {
		if (!(this.val == this.min)) {
			this.val -= 1;
		}
	}

	up() {
		if (!(this.val == this.max)) {
			this.val += 1;
		}
	}
}

enum TimeOfDay {
	AM,
	PM
}

enum Weekday {
	Mon,
	Tue,
	Wed,
	Thu,
	Fri,
	Sat,
	Sun
}

interface ValidationResult {
	[key: string]: boolean;
}

class DateTimeValidator {
	static shouldBeTime(control: Control): ValidationResult {
		let validation = control.value.trim().match(/^\d{1,2}:\d{1,2}$/i),
				error: ValidationResult = { "shouldBeTime": true };
		if (!validation) {
			return error;
		} else {
			let [hr, min] = control.value.trim().split(":");
			hr = parseInt(hr);
			min = parseInt(min);
			if (hr < 0 || hr > 24) { return error; }
			if (min < 0 || min > 60) { return error; }
		}
		return null;
	}

	static shouldBeDate(control: Control): ValidationResult {
		let validation = control.value.trim().match(/^\d{1,2}\/\d{1,2}\/\d{4}$/i),
				error: ValidationResult = { "shouldBeDate": true };

		if (!validation) {
			return error;
		} else {
			let [m, d, _] = control.value.trim().split("/");
			m = parseInt(m); d = parseInt(d);
			if (m < 1 || m > 12) { return error; }
			if (d < 1 || d > 31) { return error; }
		}
		return null;
	}
}

@Component({
	selector: 'mj-time',
	template: `
		<div class="mj__time">
			<form [ngFormModel]="dateTimeForm">
				<div class="row">
					<div>{{ formatted }}</div>
					<section>
						<input type="text" [disabled]="disabled" ngControl="dateControl" (ngModelChange)="emitEvent()" />
					</section>
					<section>
						<input type="text" ngControl="timeControl" (ngModelChange)="emitEvent()" />
					</section>
					<section>
						<radius-select [items]="timeOfDay" [selected]="0"></radius-select>
					</section>
				</div>
			</form>
		</div>
	`,
	directives: [RadiusSelectComponent]
})
export class MjTime implements OnInit {
	@Input() time: Time;
	@Input() disabled: boolean = false;
	timeControl: Control;
	dateControl: Control;
	dateTimeForm: ControlGroup;

	timeOfDay: SelectObject[] = [
		{ value: TimeOfDay.AM, text: 'AM' },
		{ value: TimeOfDay.PM, text: 'PM' }
	]

	emitEvent() {
	}

	constructor(private fb: FormBuilder) {
		let date = new Date();
		this.time = {
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear(),
			hour: 1,
			minute: 0
		}

		this.timeControl = new Control(
			`${this.time.hour}:${this.time.minute}`,
			Validators.compose([Validators.required, DateTimeValidator.shouldBeTime]));

		this.dateControl = new Control(
			`${this.time.month}/${this.time.day}/${this.time.year}`,
			Validators.compose([Validators.required, DateTimeValidator.shouldBeDate]));

		this.dateTimeForm = fb.group({
			'timeControl': this.timeControl,
			'dateControl': this.dateControl
		});
	}

	ngOnInit() {
	}

	get formatted() {
		return `${JSON.stringify(this.dateTimeForm.value)} -- Valid: ${this.dateTimeForm.valid}`;
	}
}


@Component({
	template: `
		<div class="contextual__form">
			<h4 class="form__lnr">
				<span class="lnr lnr-pencil"></span>
				Create a new event
			</h4>
			<div class="form__wrap">
				<form>
					<div class="form__group">
						<label for="">Template</label>
						<input type="hidden" [(ngModel)]="templateId" ngControl="template" />
						<radius-select (update)="updateTemplate($event)" [items]="templates" [selected]="0"></radius-select>
						<div class="form__desc">
							Select the template you want this event to use
						</div>
					</div>
					<div class="form__group">
						<label for="">From</label>
						<mj-time></mj-time>
					</div>
					<div class="form__group">
						<label for="">To</label>
						<mj-time [disabled]="true"></mj-time>
					</div>
					<div class="form__group">
						<label for="">Repeat?</label>
						<radius-radio [on]="false" [intext]="true"></radius-radio>
						<div class="form__desc">
							Do you want to repeat the event
						</div>
					</div>
					<div>
						<div class="form__group">
							<label for="">Repeat from</label>
							<mj-time></mj-time>
						</div>
						<div class="form__group">
							<label for="">Repeat to</label>
							<mj-time></mj-time>
						</div>
					</div>
					<div class="form__group">
						<label for="">Select repeat days</label>
						<div class="weekdays">
							<section>
								<mj-radio [on]="false" [text]="'Mon'"></mj-radio>
							</section>
							<section>
								<mj-radio [on]="false" [text]="'Tue'"></mj-radio>
							</section>
							<section>
								<mj-radio [on]="false" [text]="'Wed'"></mj-radio>
							</section>
							<section>
								<mj-radio [on]="false" [text]="'Thu'"></mj-radio>
							</section>
							<section>
								<mj-radio [on]="false" [text]="'Fri'"></mj-radio>
							</section>
							<section>
								<mj-radio [on]="false" [text]="'Sat'"></mj-radio>
							</section>
							<section>
								<mj-radio [on]="false" [text]="'Sun'"></mj-radio>
							</section>
						</div>
					</div>
					<div class="form__group">
						<button class="button type__3">Create Segment</button>
						<button class="button type__4">Cancel</button>
					</div>
				</form>
			</div>
		</div>
	`,
	directives: [MjRadio, MjNumber, MjTime, RadiusInputComponent, RadiusRadioComponent, RadiusSelectComponent]
})
class SegmentCreate implements OnInit {
	segment: Segment;

	templateId: string;
	template: Control;
	start: Control;
	end: Control;
	repeat: Control;
	repeatStart: Control;
	repeatEnd: Control;
	instanceOf: Control;
	location: Control;

	segmentForm: ControlGroup;

	templates: SelectObject[];

	constructor(private builder: FormBuilder) {
		this.template = new Control('', Validators.required);

		this.segmentForm = builder.group({
			'template': this.template,
		})
	}

	ngOnInit() {
		this.templates = [
			{ value: '9asj1924', text: 'Advising' },
			{ value: '935aj1924', text: 'Office hour' },
			{ value: '9asjkc1924', text: 'Open appointment' },
		];
	}

	updateTemplate(event: string) { this.templateId = event };
}
@Component({
	template: `
		<h2>Segment Show</h2>
	`
})
class Segments {

}

@Component({
	selector: 'contextual-menu',
	template: `
		<div class="contextual__menu">
			<h4>Segments</h4>
			<ul>
				<li><a [routerLink]="['/SegmentViewport']">View all</a></li>
				<li><a [routerLink]="['/SegmentViewport', 'SegmentCreate']">Create new</a></li>
			</ul>
		</div>
	`,
	directives: [RouterLink]
})
class ContextualMenu {
}


@Component({
	template: `
		<layout-header></layout-header>
		<div class="wrapping__viewport">
			<contextual-menu></contextual-menu>
			<div class="wrapping__content">
				<router-outlet></router-outlet>
			</div>
		</div>
	`,
	directives: [RouterLink, RouterOutlet, LayoutHeader, ContextualMenu]
})
@RouteConfig([
		{ path: '/', name: 'Segments', component: Segments, useAsDefault: true },
		{ path: '/new', name: 'SegmentCreate', component: SegmentCreate },
])
export class SegmentViewport {

}