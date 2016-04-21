import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {NotificationService, Notification} from '../notification.service';

import {LayoutHeader} from '../layouts/header.layout';
import {Template, UserType, User} from '../interfaces/interface';
import {TemplateService} from '../services/template.service';
import {RadiusInputComponent, RadiusSelectComponent, RadiusRadioComponent} from '../form/form.component';

import {AuthService} from '../auth/auth.service';


var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};

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
		<div class="mj__number" [ngClass]="{focus: focus, invalid: error}">
			<input type="text" (focus)="focus=true" (blur)="focus=false" [(ngModel)]="val" (ngModelChange)="emitValue()" />
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

	focus: boolean = false;

	emitValue() {
		this.update.next(`${this.val}`);
	}

	down() {
		if (!this.error) {
			if (!(this.val == this.min)) {
				this.val -= 1;
			}
		}

		this.emitValue();
	}

	up() {
		if (!(this.val == this.max)) {
			this.val += 1;
		}

		this.emitValue();
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
		let error: ValidationResult = { "shouldBeInterval": true },
			validation = control.value.toString().trim().match(/^[\d]+$/i);
		if (!validation) {
			return error;
		} else {
			let v = parseInt(control.value);
			if (v < 10 || v > 60) {
				return error;
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
				<form [ngFormModel]="templateForm">
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
						<label for="">Interval [minute 10-60]</label>
						<input type="hidden" [(ngModel)]="template.interval" ngControl="interval" />
						<mj-number [error]="intervalDirty && !interval.valid" (update)="intervalUpdate($event)" [val]="template.interval" [min]="10" [max]="60"></mj-number>
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
						<button (click)="submit()" class="button type__3">Create Template</button>
						<button class="button type__4">Cancel</button>
					</div>
				</form>
				<div>{{json}}</div>
				valid? {{templateForm.valid}}
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

	notification$: Observable<Notification>;

	defaultNames: string[] = ['advising', 'office hour', 'open appointments'];

	constructor(
		private fb: FormBuilder,
		private templateService: TemplateService,
		private router: Router,
		private notificationService: NotificationService
	) {
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
		this.templateService.getNewTemplate().then(template => this.template = template);
		this.notification$ = this.templateService.notification$;
		this.notification$.subscribe(
			(data) => {
				let {message, type} = data;
				this.notificationService.notify(message, true, !type);
				if (type) {
					this.router.navigateByUrl('/templates');
				}
			}
		);
	}

	submit() {
		if (this.templateForm.valid) {
			this.templateService.addTemplate(this.template);
		} else {
			this.notificationService.notify("Template form not valid", true, true);
		}
	}

	nameUpdate(event: string) { this.nameDirty = true; this.template.name = event; }
	intervalUpdate(event: string) { this.intervalDirty = true; this.template.interval = parseInt(event); }
	allowMultipleUpdate(event: boolean) { this.template.allow_multiple = event; }
	requireAcceptUpdate(event: boolean) { this.template.require_accept = event; }

	get json() {
		return JSON.stringify(this.template);
	}
}

@Component({
	selector: 'template-editor',
	template: `
		<div class="inner__row" *ngIf="template">
			<div class="form__wrap">
				<form [ngFormModel]="editForm">
					<h3>Edit</h3>
					
					<div class="inner__row">
						<section>
							<label>Template name:</label>
							<input type="text" [(ngModel)]="morphTemplate.name" ngControl="name" />
						</section>
						<section>
							<label>Allow multiple?</label>
							<radius-radio (update)="updateAllow($event)" [on]="template.allow_multiple" [intext]="true"></radius-radio>
						</section>
						<section>
							<label>Require Accept?</label>
							<radius-radio (update)="updateAccept($event)" [on]="template.require_accept" [intext]="true"></radius-radio>
						</section>
					</div>

					<div class="inner__row">
						<section>
							<button class="button type__2" (click)="updateTemplate()">Update template</button>
							<button class="button type__1" (click)="remove()">Delete</button>
						</section>
					</div>
				</form>
			</div>
		</div>
	`,
	directives: [RadiusRadioComponent]
})
class TemplateEditor implements OnInit {
	@Input() template: Template;
	
	morphTemplate: Template;

	name: Control;
	nameDirty: boolean = false;

	editForm: ControlGroup;

	constructor(
		private templateService: TemplateService,
		private fb: FormBuilder,
		private notificationService: NotificationService
	) { }

	ngOnInit() {
		let { id, allow_multiple, require_accept, name } = this.template;

		this.morphTemplate = {
			id: id,
			allow_multiple: allow_multiple,
			require_accept: require_accept,
			name: name
		};

		this.name = new Control(this.template.name, Validators.compose([Validators.required, TemplateValidator.shouldBeName]));
		this.editForm = this.fb.group({
			'name': this.name
		});
	}

	updateAllow(event: boolean) {
		this.morphTemplate.allow_multiple = event;
	}

	updateAccept(event: boolean) {
		this.morphTemplate.require_accept = event;
	}

	updateTemplate() {
		if (this.editForm.valid) {
			this.templateService.updateTemplate(this.morphTemplate).then((response) => {
				if (response.success) {
					this.notificationService.notify(`Template has been modified`, true);
					this.template.name = response.payload.name;
					this.template.allow_multiple = response.payload.allow_multiple;
					this.template.require_accept = response.payload.require_accept;
				} else {
					this.notificationService.notify(`Sorry, could not modify template`, true, true);
				}
			});
		} else {
			this.notificationService.notify(`Invalid form data`, true, true);
		}
	}

	remove() {
		this.templateService.removeTemplate(this.template.id);
	}

	get json() {
		return JSON.stringify(this.morphTemplate);
	}
}


@Component({
	selector: 'template-detail',
	template: `
		<li *ngIf="template" class="template__detail">
			<div class="inner__row">
				<section>
					<strong>{{template.name}}</strong>
				</section>
				<section>
					Interval {{template.interval}} min
				</section>
				<section>
					<button class="lnr" [ngClass]="{'lnr-pencil': !show, 'lnr-cross': show}" (click)="show=!show"></button>
				</section>
			</div>

		<template-editor [template]="template" *ngIf="show"></template-editor>

		</li>
	`,
	directives: [TemplateEditor]
})
class TemplateDetail {
	@Input() template: Template;

	show: boolean = false;
}

@Component({
	template: `
		<h3>Templates</h3>
		<ul *ngIf="templates" class="table">
			<template-detail *ngFor="#t of templates" [template]="t">
			</template-detail>
		</ul>
	`,
	directives: [TemplateDetail]
})
class Templates implements OnInit {
	templates: Template[];
	templates$: Observable<Template[]>;
	notification$: Observable<Notification>;

	constructor(
		private templateService: TemplateService,
		private notificationService: NotificationService,
		private authService: AuthService
	) {
	}

	ngOnInit() {
		let [_, session] = this.authService.getSession();
		this.notification$ = this.templateService.notification$;
		this.notification$.subscribe(
			(data) => {
				let {message, type} = data;
				this.notificationService.notify(message, true, !type);
			}
		);

		this.templates$ = this.templateService.templates$;
		this.templates$.subscribe(
			(templates) => {
				this.templates = templates;
			});

		this.templateService.getTemplates(session.id);
	}

	remove(id: string) {
		this.templateService.removeTemplate(id);
	}

	flush() {
		localStorage.removeItem('templates');
	}
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
		<div class="wrapping__viewport">
			<contextual-menu></contextual-menu>
			<div class="wrapping__content">
				<router-outlet></router-outlet>
			</div>
		</div>
	`,
	directives: [RouterLink, RouterOutlet, ContextualMenu]
})
@RouteConfig([
		{ path: '/', name: 'Templates', component: Templates, useAsDefault: true },
		{ path: '/new', name: 'TemplateCreate', component: TemplateCreate },
])
export class TemplateViewport implements OnInit {
	constructor(
		private authService: AuthService,
		private router: Router
	) { }

	ngOnInit() {
	}
}