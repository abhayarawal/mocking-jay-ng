import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {CalendarService, MonthPipe, WeekFullPipe} from './calendar.service';

var range = (x, y): number[] => {
	let temp = [];
	for (let j = x; j <= y; j++) { temp.push(j); }
	return temp;
}

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