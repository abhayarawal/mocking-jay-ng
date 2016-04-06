import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {LayoutHeader} from '../layouts/header.layout';
import {Segment, Time, Template} from '../interfaces/interface';
import {RadiusInputComponent, RadiusSelectComponent, RadiusRadioComponent, SelectObject} from '../form/form.component';

import {TemplateService} from '../templates/template.service';
import {SegmentService} from '../segments/segment.service';


// TOO MUCH MONKEY PATCHING ..... FIX IT!!!!!

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
					<section>
						<input type="text" [disabled]="disabled" ngControl="date" (ngModelChange)="emitEvent()" />
					</section>
					<section>
						<input type="text" ngControl="time" (ngModelChange)="emitEvent()" />
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
	@Input() _time: Time;
	@Input() disabled: boolean = false;
	@Output() update = new EventEmitter<{}>();

	time: Control;
	date: Control;
	dateTimeForm: ControlGroup;

	timeOfDay: SelectObject[] = [
		{ value: TimeOfDay.AM, text: 'AM' },
		{ value: TimeOfDay.PM, text: 'PM' }
	]

	emitEvent() {
		if (this.dateTimeForm.valid) {
			this.update.next(this.dateTimeForm.value);
		} else {
			this.update.next({ valid: false });
		}
	}

	constructor(private fb: FormBuilder) {
		let _date = new Date();
		this._time = {
			day: _date.getDate(),
			month: _date.getMonth()+1,
			year: _date.getFullYear(),
			hour: 1,
			minute: 0
		}

		this.time = new Control(
			`${this._time.hour}:${this._time.minute}`,
			Validators.compose([Validators.required, DateTimeValidator.shouldBeTime]));

		this.date = new Control(
			`${this._time.month}/${this._time.day}/${this._time.year}`,
			Validators.compose([Validators.required, DateTimeValidator.shouldBeDate]));

		this.dateTimeForm = fb.group({
			'time': this.time,
			'date': this.date
		});
	}

	ngOnInit() {
	}

	get formatted() {
		return ``;
		// return `${JSON.stringify(this.dateTimeForm.value)} -- Valid: ${this.dateTimeForm.valid}`;
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
				{{formatted}}
				<form>
					<div class="form__group">
						<label for="">Template</label>
						<radius-select (update)="updateTemplate($event)" [items]="templates" [selected]="0"></radius-select>
						<div class="form__desc">
							Select the template you want this event to use
						</div>
					</div>
					<div class="form__group">
						<label for="">From</label>
						<mj-time (update)="updateStart($event)"></mj-time>
					</div>
					<div class="form__group">
						<label for="">To</label>
						<mj-time [disabled]="true" (update)="updateEnd($event)"></mj-time>
					</div>
					<div class="form__group">
						<label for="">Repeat?</label>
						<radius-radio (update)="updateRepeat($event)" [on]="false" [intext]="true"></radius-radio>
						<div class="form__desc">
							Do you want to repeat the event
						</div>
					</div>
					<div *ngIf="repeatView">
						<div class="form__group">
							<label for="">Repeat from</label>
							<mj-time></mj-time>
						</div>
						<div class="form__group">
							<label for="">Repeat to</label>
							<mj-time></mj-time>
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
					</div>
					<div class="form__group">
						<button (click)="submit()" class="button type__3">Create Segment</button>
						<button class="button type__4">Cancel</button>
					</div>
				</form>
			</div>
		</div>
	`,
	directives: [MjRadio, MjTime, RadiusInputComponent, RadiusRadioComponent, RadiusSelectComponent]
})
class SegmentCreate implements OnInit {
	segment: Segment;
	repeatView: boolean = false;

	template: string;

	segmentForm: ControlGroup;

	templates: SelectObject[];
	templates$: Observable<Template[]>;

	constructor(private builder: FormBuilder,
							private templateService: TemplateService,
							private segmentService: SegmentService) {
	}

	updateTemplate(event: string) {
		this.template = event;
		this.templateService.getTemplate(this.template).then(template => this.segment.template = template);
	};

	updateRepeat(event: boolean) { this.repeatView = event };

	updateStart(event: any) {
		if (!('valid' in event)) {
			let {date, time} = event,
					[m, d, y] = date.split("/"),
					[hr, min] = time.split(":");

			this.segment.start = {
				day: parseInt(d), 
				month: parseInt(m)-1,
				year: parseInt(y),
				hour: parseInt(hr),
				minute: parseInt(min)
			}

			this.segment.end = {
				day: parseInt(d),
				month: parseInt(m) - 1,
				year: parseInt(y),
				hour: this.segment.end.hour,
				minute: this.segment.end.minute
			}
		}
	}

	updateEnd(event: any) {
		if (!('valid' in event)) {
			let {_, time} = event,
					[hr, min] = time.split(":");

			this.segment.end = {
				day: this.segment.start.day,
				month: this.segment.start.month,
				year: this.segment.start.year,
				hour: parseInt(hr),
				minute: parseInt(min)
			};
		}
	}

	submit() {
		this.segmentService.addSegment(this.segment);
	}

	ngOnInit() {
		this.templates$ = this.templateService.templates$;
		this.templates$.subscribe(
			(templates) => {
				this.templates = templates.map((template) => {
					return { value: template.id, text: template.name }
				});
			}
		);
		this.templateService.triggerObserve();

		this.segmentService.getNewSegment().then(segment => this.segment = segment);
	}

	get formatted() {
		return ``;
		// return JSON.stringify(this.segment);
	}
}




@Component({
	template: `
		<h3>Segments</h3>
		<ul *ngIf="segments" class="table">
			<li *ngFor="#segment of segments">
				<section>
				<h4>{{segment.template.name}}</h4>
				</section>
				<section>
					<h5>{{segment.start.month}}/{{segment.start.day}}/{{segment.start.year}}</h5>
					<div>
						<strong>From</strong> {{segment.start.hour}}:{{segment.start.minute}} 
						<strong>To:</strong> {{segment.end.hour}}:{{segment.end.minute}}
					</div>
				</section>
				<section>
					<a class="button type__2" (click)="remove(segment.id)">Remove</a>
				</section>
			</li>
		</ul>
	`
})
class Segments implements OnInit {

	segments: Segment[];
	segments$: Observable<Segment[]>;

	constructor(private segmentService: SegmentService) {
	}

	ngOnInit() {
		this.segments$ = this.segmentService.segments$;
		this.segments$.subscribe(
			(data) => {
				this.segments = data;
			}
		);
		this.segmentService.triggerObserve();
	}

	remove(id: string) {
		this.segmentService.removeSegment(id);
	}
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