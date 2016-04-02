import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {CalendarService, MonthPipe, WeekFullPipe} from './calendar.service';
import {Time, Template, Segment, Status, Fragment} from '../interfaces/interface';

var range = (x, y): number[] => {
	let temp = [];
	for (let j = x; j <= y; j++) { temp.push(j); }
	return temp;
}

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


var template: Template = {
	id: genId(),
	name: "advising",
	interval: 15,
	allow_multiple: true,
	color: "#885EC4",
	require_accept: true
};

var segment: Segment = {
	id: genId(),
	template: template,
	start: {
		day: 2,
		month: 3,
		year: 2016,
		hour: 10,
		minute: 30
	},
	end: {
		day: 2,
		month: 3,
		year: 2016,
		hour: 14,
		minute: 15
	},
	repeat: false,
	location: "Empire State Rm205"
};


var genFragments = (segment: Segment) => {
	let [t1, m1] = [10, 45],
			[t2, m2] = [15, 30];

	let d1 = new Date(2016, 3, 2, t1, m1),
			d2 = new Date(2016, 3, 2, t2, m2);

	let diff = (d2 - d1)/1000/60;	
	console.log("diff", diff);

}

genFragments(segment);


@Component({
	selector: 'day-component',
	template: `
		<div class="day__component">
			<div *ngIf="month">
				<h3 class="day__date">{{month | monthPipe}} {{day}}, <span>{{year}}</span></h3>
				<h4>{{ weekDay | weekFullPipe }}</h4>
			</div>

			<ul>
				<li *ngFor="#a of arr">
					{{a}}
				</li>
			</ul>
		</div>
	`,
	pipes: [MonthPipe, WeekFullPipe],
	providers: [CalendarService]
})
class DayComponent implements OnInit {
	arr: number[] = range(1, 50);

	id: string;
	month: number;
	year: number;
	day: number;
	weekDay: number;

	constructor(private calendarService: CalendarService) {}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();

		this.id = id;
		this.month = date.getMonth();
		this.year = date.getFullYear();
		this.day = date.getDate();
		this.weekDay = date.getDay();
	}
}


@Component({
	selector: 'segment-viewport',
	template: `
		<div class="segment__viewport">
			<day-component [id]="id" [year]="year" [month]="month" [day]="day"></day-component>
		</div>
	`,
	directives: [DayComponent]
})
export class SegmentViewport {
}