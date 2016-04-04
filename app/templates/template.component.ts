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


@Component({
	template: `
		<div class="contextual__form">
			<h4 class="form__lnr">
				<span class="lnr lnr-pencil"></span>
				Create a new template
			</h4>
			<div class="form__wrap">
				<form>
					<div class="form__group">
						<label for="">Name</label>
						<input type="text" name="" id="" />
					</div>
					<div class="form__group">
						<label for="">Interval (min)</label>
						<mj-number [val]="0" [min]="10" [max]="60"></mj-number>
					</div>
					<div class="form__group">
						<label for="">Allow multiple?</label>
						<mj-radio></mj-radio>
					</div>
					<div class="form__group">
						<label for="">Require accept?</label>
						<mj-radio [on]="true"></mj-radio>
					</div>
				</form>
			</div>
		</div>
	`,
	directives: [MjRadio, MjNumber, RadiusInputComponent, RadiusRadioComponent, RadiusSelectComponent]
})
class TemplateCreate implements OnInit {
	template: Template;

	name: Control;
	interval: Control;
	allow_multiple: Control;
	color: Control;
	require_accept: Control;

	templateForm: ControlGroup;

	constructor(private builder: FormBuilder) {
		this.name = new Control('', Validators.compose([Validators.required]));

		this.templateForm = builder.group({
			'name': this.name
		})
	}

	ngOnInit() {

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