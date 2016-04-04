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

enum MM {
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

@Component({
	selector: 'mj-time',
	template: `
		<div class="mj__time">
			<div class="row">
				<section>
					<input type="text" [(ngModel)]="date" />
				</section>
				<section>
					<input type="text" [(ngModel)]="hrMin" />
				</section>
				<section>
					<radius-select [items]="mm" [selected]="0"></radius-select>
				</section>
			</div>
		</div>
	`,
	directives: [RadiusSelectComponent]
})
export class MjTime implements OnInit {
	@Input() time: Time;
	hrMin: String;
	date: String;

	mm: SelectObject[] = [
		{value: MM.AM, text: 'AM'},
		{value: MM.PM, text: 'PM'}
	]

	ngOnInit() {
		let date = new Date();
		this.time = {
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear(),
			hour: 1,
			minute: 0
		}

		this.hrMin = `${this.time.hour}:${this.time.minute}`;
		this.date = `${this.time.month}/${this.time.day}/${this.time.year}`;
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
						<radius-select [items]="templates" [selected]="0"></radius-select>
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
						<mj-time></mj-time>
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
	template: Segment;

	name: Control;
	interval: Control;
	allow_multiple: Control;
	color: Control;
	require_accept: Control;

	templateForm: ControlGroup;

	templates: SelectObject[];


	constructor(private builder: FormBuilder) {
		this.name = new Control('', Validators.compose([Validators.required]));

		this.templateForm = builder.group({
			'name': this.name
		})
	}

	ngOnInit() {
		this.templates = [
			{ value: '9asj1924', text: 'Advising' },
			{ value: '935aj1924', text: 'Office hour' },
			{ value: '9asjkc1924', text: 'Open appointment' },
		];
	}
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