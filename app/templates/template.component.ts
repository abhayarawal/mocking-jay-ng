import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {LayoutHeader} from '../layouts/header.layout';
import {Template} from '../interfaces/interface';

import {RadiusInputComponent, RadiusSelectComponent, RadiusRadioComponent} from '../form/form.component';


@Component({
	selector: 'mj-radio',
	template: `
		<div class="mj__radio" [ngClass]="{on: on}" (click)="toggle()">
			&nbsp;
		</div>
	`
})
export class MjRadio {
	@Input() on: boolean = false;
	@Output() update = new EventEmitter<boolean>();

	toggle() {
		this.on = !!!this.on;
		this.update.next(this.on);
	}
}

@Component({
	selector: 'mj-number',
	template: `
		<div class="mj__number" [ngClass]="{invalid: error}">
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
	@Input() error: boolean = false;
	@Output() update = new EventEmitter<string>();

	emitValue() {
		this.update.next(`${this.val}`);
	}

	down() {
		if (!this.error) {
			if (!(this.val == this.min)) {
				this.val -= 1;
			}
		}
	}

	up() {
		if (!(this.val == this.max)) {
			this.val += 1;
		}
	}
}

interface ValidationResult {
	[key: string]: boolean;
}

class TemplateValidator {
	static shouldBeName(control: Control): ValidationResult {
		let validation = control.value.trim().match(/^[a-z0-9\s]+$/i);
		if (!validation) {
			return { "shouldBeName": true };
		}
		return null;
	}

	static shouldBeInterval(control: Control): ValidationResult {
		let validation = control.value.toString().trim().match(/^[\d]+$/i);
		if (!validation) {
			return { "shouldBeInterval": true };
		} else {
			let v = parseInt(control.value);
			if (v < 10 || v > 60) {
				return { "shouldBeInterval": true };
			}
		}
		return null;
	}
}

@Component({
	template: `
		<div class="contextual__form">
			<h4 class="form__lnr">
				<span class="lnr lnr-pencil"></span>
				Create a new template
			</h4>
			<div class="form__wrap" *ngIf="template">
				{{json}}
				<form [ngFormModel]="templateForm" (submit)="submit()">
					<div class="form__group">
						<label for="">Name</label>
						<input type="hidden" [(ngModel)]="template.name" ngControl="name" />
						<radius-input [error]="nameDirty && !name.valid" (update)="nameUpdate($event)" [suggestions]="defaultNames"></radius-input>
						<div class="form__desc">
							Enter name of the template
							<span>e.g advising</span>
						</div>
					</div>
					<div class="form__group">
						<label for="">Interval (min)</label>
						<input type="hidden" [(ngModel)]="template.interval" ngControl="interval" />
						<mj-number [error]="intervalDirty && !interval.valid" (update)="intervalUpdate($event)" [val]="0" [min]="10" [max]="60"></mj-number>
						<div class="form__desc">
							Enter interval for each meeting
						</div>
					</div>
					<div class="form__group">
						<label for="">Allow multiple?</label>
						<input type="hidden" [(ngModel)]="template.allow_multiple" ngControl="allowMultiple" />
						<radius-radio (update)="allowMultipleUpdate($event)" [on]="template.allow_multiple" [intext]="true"></radius-radio>
						<div class="form__desc">
							Can students select multiple time slots for meeting?
						</div>
					</div>
					<div class="form__group">
						<label for="">Require accept?</label>
						<input type="hidden" [(ngModel)]="template.require_accept" ngControl="requireAccept" />
						<radius-radio [on]="template.require_accept"(update)="requireAcceptUpdate($event)" [intext]="true"></radius-radio>
						<div class="form__desc">
							Do you want to approve each appointment in this template?
						</div>
					</div>
					<div class="form__group">
						<button type="submit" class="button type__3">Create Template</button>
						<button class="button type__4">Cancel</button>
					</div>
				</form>
				{{templateForm.valid}}
			</div>
		</div>
	`,
	directives: [MjRadio, MjNumber, RadiusInputComponent, RadiusRadioComponent, RadiusSelectComponent]
})
class TemplateCreate implements OnInit {
	template: Template;

	name: Control;
	nameDirty: boolean = false;
	interval: Control;
	intervalDirty: boolean = false;
	allowMultiple: Control;
	requireAccept: Control;

	templateForm: ControlGroup;

	defaultNames: string[] = ['advising', 'office hour', 'open appointments'];

	constructor(private fb: FormBuilder) {
		this.name = new Control('', Validators.compose([Validators.required, TemplateValidator.shouldBeName]));
		this.interval = new Control(10, Validators.compose([Validators.required, TemplateValidator.shouldBeInterval]));
		this.allowMultiple = new Control(false, Validators.required);
		this.requireAccept = new Control(true, Validators.required);

		this.templateForm = fb.group({
			'name': this.name,
			'interval': this.interval,
			'allowMultiple': this.allowMultiple,
			'requireAccept': this.requireAccept
		});
	}

	ngOnInit() {
		this.template = {
			id: "992jsdaf",
			name: "",
			interval: 15,
			allow_multiple: false,
			require_accept: true
		}
	}

	submit() {
		console.log(this.templateForm.valid, this.templateForm.value);
	}

	nameUpdate(event: string) {
		this.nameDirty = true;
		this.template.name = event;
	}

	intervalUpdate(event: string) {
		this.intervalDirty = true;
		this.template.interval = event;
	}

	allowMultipleUpdate(event: boolean) {
		this.template.allow_multiple = event;
	}

	requireAcceptUpdate(event: boolean) {
		this.template.require_accept = event;
	}

	get json() {
		return JSON.stringify(this.template);
	}
}
@Component({
	template: `
		<h2>Template Show</h2>
	`
})
class Templates {

}

@Component({
	selector: 'contextual-menu',
	template: `
		<div class="contextual__menu">
			<h4>Templates</h4>
			<ul>
				<li><a [routerLink]="['/TemplateViewport']">View all</a></li>
				<li><a [routerLink]="['/TemplateViewport', 'TemplateCreate']">Create new</a></li>
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
		{ path: '/', name: 'Templates', component: Templates, useAsDefault: true },
		{ path: '/new', name: 'TemplateCreate', component: TemplateCreate },
])
export class TemplateViewport {

}