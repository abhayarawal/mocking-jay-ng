import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle} from 'angular2/common';



export interface SelectObject {
	value: any,
	text: string
}

@Component({
	selector: 'radius-progress',
	template: `
		<div class="radius-progress" [ngClass]="{complete: done==='100%'}">
			<span class="lnr lnr-spell-check"></span>
			<div class="progress">
				<span class="done" [ngStyle]="{'width': done}"></span>
				<em>{{ text }}</em>
			</div>
		</div>
	`,
	directives: [NgStyle]
})
export class RadiusProgressComponent {
	@Input() done: string = "0%";
	@Input() text: string = "";
}


@Component({
	selector: 'radius-radio',
	template: `
		<div class="radius-radio" (click)="toggle()" [ngClass]="{on: on}">
			<span class="left" *ngIf="intext">On</span>
			<span class="radio-knob"></span>
			<span class="right" *ngIf="intext">Off</span>
		</div>
	`
})
export class RadiusRadioComponent {
	@Input() on: boolean;
	@Input() intext: boolean;
	@Output() update = new EventEmitter<boolean>();

	// needs eventemitter

	toggle() {
		this.on = !!!this.on;
		this.update.next(this.on);
	}
}

@Component({
	selector: 'radius-select',
	template: `
		<div class="radius-select" tabindex="100" (blur)="hide()">
			<div class="selected-item" (click)="show=true" [ngClass]="{focused: show}">
				{{ items[selected].text }}
				<span class="lnr lnr-chevron-down"></span>
			</div>
			<ul [ngClass]="{show: show}">
				<li *ngFor="#item of items; #i = index" (click)="select(i)" [ngClass]="{selected: i===selected}">{{ item.text }}</li>
			</ul>
		</div>
	`
})
export class RadiusSelectComponent implements OnInit {
	@Input() items: SelectObject[];
	@Input() selected: number = 0;
	@Output() update = new EventEmitter<number>();

	show: boolean = false;
	timeout: any;

	select(i: number) {
		this.selected = i;
		this.hide();
		this.update.next(this.items[this.selected].value);
	}

	hide() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => { this.show = false; }, 250);
	}

	ngOnInit() {
		this.select(this.selected);
	}
}


@Pipe({
	name: 'boldPipe'
})
class BoldPipe implements PipeTransform {
	transform(value: string, args: string[]): any {
		let replacement = args[0].toLowerCase().trim();
		return value.toLowerCase().replace(replacement, `<span>${replacement}</span>`);
	}
}

@Pipe({
	name: "searchFilter"
})
class SearchFilterPipe implements PipeTransform {
	transform(list: any, args: string[]): any {
		let filter = args[0].toLocaleLowerCase().trim();
		return list.filter((v) => v.toLowerCase().indexOf(filter) > -1).slice(0, 9);
	}
}

@Component({
	selector: 'radius-input',
	template: `
		<div class="radius-input">
			<input type="text" [ngClass]="{invalid: error}" placeholder="{{placeholder}}" [(ngModel)]="valore" (ngModelChange)="emitValue()" (focus)="show=true" (blur)="hide()" />
			<ul [ngClass]="{show: show}" *ngIf="(suggestions | searchFilter:valore).length > 0">
				<div class="arrow-up"></div>
				<li *ngFor="#suggestion of suggestions | searchFilter:valore" (click)="setValue(suggestion)" [innerHTML]="(suggestion | boldPipe:valore)"></li>
			</ul>
		</div>
	`,
	pipes: [SearchFilterPipe, BoldPipe]
})
export class RadiusInputComponent {
	@Output() update = new EventEmitter<string>();
	@Input() suggestions: string[];
	@Input() error: boolean = false;
	@Input() placeholder: string = "";

	show: boolean = false;
	valore: string = "";
	timeout: any;
	initEmit: boolean = false;

	emitValue() {
		this.update.next(this.valore.trim());
	}

	setValue(val: string) {
		this.valore = val;
		this.emitValue();
	}

	hide() {
		if (this.initEmit === false) {
			this.emitValue();
			this.initEmit = true;
		}

		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => { this.show = false; }, 350);
	}
}