import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {SegmentViewService} from './segment.view.service';
import {CalendarService, MonthPipe, WeekPipe, WeekFullPipe} from './calendar.service';
import {Time, Template, Segment, Status, Fragment, User} from '../interfaces/interface';

import {UserService} from '../services/user.service';
import {FragmentService} from '../services/fragment.service';
import {SegmentService} from '../services/segment.service';
import {Notification, NotificationService} from '../notification.service';


var range = (x, y): number[] => {
	let temp = [];
	for (let j = x; j <= y; j++) { temp.push(j); }
	return temp;
}

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


@Pipe({
	name: 'timePipe'
})
export class TimePipe implements PipeTransform {
	transform(obj: Fragment, args: string[]): any {
		let h = obj.start.hour,
				m: any = obj.start.minute;

		if (args[0]) {
			h = obj.end.hour;
			m = obj.end.minute;
		}

		if (m < 10) { m = `0${m}`; }

		if (h == 12) { return `${h}:${m} Pm`; }
		else if (h > 12) { return `${h - 12}:${m} Pm`; }
		return `${h}:${m} Am`;
	}
}

@Component({
	selector: 'segment-unavailable',
	template: `
		<div class="segment">
			<div class="segment__time"></div>
			<div class="fragments">
				<ul>
					<li *ngFor="#a of arr">&nbsp;</li>
				</ul>
			</div>
		</div>
	`
})
class SegmentUnavailable implements OnInit {
	@Input() count: number = 5;
	arr: number[] = [];

	ngOnInit() {
		this.arr = range(1, this.count);
	}
}


@Component({
	selector: 'fragment-component',
	template: `
		<li *ngIf="fragment" (click)="send()" [ngClass]="{selected: selected}" class="segment status__{{fragment.status}}">
			<span class="time">{{fragment | timePipe:false}}</span>
			<span class="event__title" [ngSwitch]="fragment.status" *ngIf="fragment.status">
				<span *ngSwitchWhen="1" [innerHTML]="'Waiting for approval'"></span>
				<span *ngSwitchWhen="2" [innerHTML]="'Approved'"></span>
				<span *ngSwitchWhen="3" [innerHTML]="'Denied'"></span>
				<span *ngSwitchWhen="4" [innerHTML]="'Cancelled'"></span>
			</span>
			<!-- <span class="lnr lnr-pencil" *ngIf="selected"></span> -->
		</li>
	`,
	pipes: [TimePipe]
})
class FragmentComponent implements OnInit {
	@Input() fragment;
	observable: Observable<Fragment>;
	selected: boolean = false;

	constructor(private segmentViewService: SegmentViewService) {}

	send() {
		if (this.fragment) {
			this.segmentViewService.triggerContext(this.fragment);
		}
	}

	ngOnInit() {
		this.observable = this.segmentViewService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.selected = false;
				if (data.id === this.fragment.id) {
					this.selected = true;
				}
			}
		)
	}
}


@Component({
	selector: 'segment-component',
	template: `
		<div class="segment" *ngIf="segment">
			<h3 class="segment__title">
				<span>{{ segment.template.name }}</span>
				{{fragments[0] | timePipe:false}} - {{fragments[fragments.length-1] | timePipe:true}}
			</h3>
			<div class="fragments">
				<ul *ngIf="fragments">
					<fragment-component *ngFor="#fragment of fragments" [fragment]="fragment"></fragment-component>
				</ul>
			</div>
		</div>
		<segment-unavailable [count]="5"></segment-unavailable>
	`,
	directives: [FragmentComponent, SegmentUnavailable],
	pipes: [TimePipe],
})
class SegmentComponent implements OnInit {
	@Input() segment: Segment;
	fragments: Fragment[];

	constructor(
		private fragmentService: FragmentService,
		private routeParams: RouteParams,
		private calendarService: CalendarService,
	) {}

	ngOnInit() {
		this.fragments = this.fragmentService.genFragments(this.segment);

		let [_, date] = this.calendarService.getRouteParams();

		let day = date.getDate(),
				month = date.getMonth(),
				year = date.getFullYear();

		this.fragmentService.getFragments(this.segment, month, day, year).then(
			(fragments) => {
				this.fragments = this.fragmentService.merge(this.fragments, fragments);
			});
	}
}


@Component({
	selector: 'segment-wrap',
	template: `
		<div class="segment__wrap">
			<div class="segments">
				<segment-unavailable [count]="2"></segment-unavailable>
				<div class="segment" *ngIf="segments.length == 0">
					<h3 class="segment__title">
						<span>No events available</span>
					</h3>
				</div>
				<segment-component *ngFor="#segment of segments" [segment]="segment"></segment-component>
			</div>
		</div>
	`,
	providers: [CalendarService],
	directives: [SegmentUnavailable, SegmentComponent]
})
class SegmentWrap {
	segments: Segment[] = [];

	constructor(
		private calendarService: CalendarService,
		private segmentService: SegmentService
	) {
	}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();

		let day = date.getDate(),
				month = date.getMonth(),
				year = date.getFullYear();

		this.segmentService.getSegmentsByRoute(id, month, day, year).then(segments => { this.segments = segments });
	}
}





@Component({
	selector: 'day-component',
	template: `
		<div class="day__component" [ngClass]="{move: fragView}">
			<div *ngIf="month" class="day__header">
				<h3 class="day__date">
					<span>{{ weekDay | weekPipe }}</span>
					{{month | monthPipe}} {{day}}, <span>{{year}}</span>
				</h3>
			</div>
			<segment-wrap></segment-wrap>
		</div>
	`,
	directives: [SegmentWrap],
	pipes: [MonthPipe, WeekPipe],
	providers: [CalendarService]
})
class DayComponent implements OnInit {
	arr: number[] = range(1, 50);
	observable: Observable<Fragment>;

	fragView: boolean = false;

	id: string;
	month: number;
	year: number;
	day: number;
	weekDay: number;

	constructor(private calendarService: CalendarService,
							private segmentViewService: SegmentViewService) {}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();

		this.id = id;
		this.month = date.getMonth();
		this.year = date.getFullYear();
		this.day = date.getDate();
		this.weekDay = date.getDay();

		this.observable = this.segmentViewService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.fragView = true;
			},
			err => { },
			() => { }
		)
	}
}

@Component({
	selector: 'fragment-context-student',
	template: `
		<div class="fragment__ctx">
			<h3>
				{{fragment.segment.template.name}}
				<span>{{fragment.segment.template.user_id}}</span>
			</h3>
			<div class="date__time">
				From: <span>{{fragment | timePipe:false}}</span> To: <span>{{fragment | timePipe:true}}</span>
			</div>
			<div>
				Location: N/A
			</div>
			<div [ngSwitch]="fragment.status" class="ctx__controls">
				<template [ngSwitchWhen]="1">
					<strong>Appointment not approved yet</strong>
					<button class="button type__1" (click)="cancel()">Cancel appointment</button>
				</template>
				<template [ngSwitchWhen]="2">
					<strong>Appointment approved</strong>
					<button class="button type__1" (click)="cancel()">Cancel appointment</button>
				</template>
				<template [ngSwitchWhen]="3">
					<strong>Appointment denied</strong>
				</template>
				<template [ngSwitchWhen]="4">
					<strong>Appointment cancelled</strong>
				</template>
				<template ngSwitchDefault>
					<button class="button type__2" (click)="create()">Create appointment</button>
				</template>
			</div>
		</div>
	`,
	pipes: [TimePipe]
})
class FragmentContextStudent implements OnInit {
	@Input() fragment: Fragment;
	@Input() user: User;

	constructor(
		private segmentViewService: SegmentViewService,
		private notificationService: NotificationService,
		private fragmentService: FragmentService
	) {
	}

	ngOnInit() {
	}

	cancel() {
		this.fragment.status = Status.default;
		this.notificationService.notify("Appointment canceled", true, true);
	}

	create() {
		if (this.fragment.segment.template.require_accept) {
			this.fragment.status = Status.in_progress;
		} else {
			this.fragment.status = Status.approved;
		}

		this.fragment.template_id = this.user.id;
		this.fragmentService.addFragment(this.fragment);

		this.notificationService.notify(`
			Appointment created for ${this.fragment.segment.template.name} at ${this.fragment.start.hour}:${this.fragment.start.minute}
		`, true, false);
	}
}

@Component({
	selector: 'fragment-context-faculty',
	template: `
		<div class="fragment__ctx">
			<h3>
				{{fragment.segment.template.name}}
				<span>{{fragment.segment.template.user_id}}</span>
			</h3>
			<div class="date__time">
				From: <span>{{fragment | timePipe:false}}</span> To: <span>{{fragment | timePipe:true}}</span>
			</div>
			<div>
				Location: N/A
			</div>
			<div [ngSwitch]="fragment.status" class="ctx__controls">
				<template [ngSwitchWhen]="1">
					<strong>Appointment not approved yet</strong>
					<button class="button type__3" (click)="approve()">Approve appointment</button>
					<div class="cancels">
						<a (click)="deny()">Deny appointment</a>
						<a href="">Deny and make unavailable</a>
					</div>
				</template>
				<template [ngSwitchWhen]="2">
					<strong>Appointment approved</strong>
					<div class="cancels">
						<a (click)="cancel()">Cancel appointment</a>
						<a href="">Cancel and make unavailable</a>
					</div>
				</template>
				<template [ngSwitchWhen]="3">
					<strong>Appointment denied</strong>
				</template>
				<template [ngSwitchWhen]="4">
					<strong>Appointment cancelled</strong>
					<div class="cancels">
						<button class="button type__1">Block interval</button>
					</div>
				</template>
				<template ngSwitchDefault>
					<button class="button type__1">Block interval</button>
				</template>
			</div>
		</div>
	`,
	pipes: [TimePipe]
})
class FragmentContextFaculty implements OnInit {
	@Input() fragment: Fragment;
	@Input() user: User;

	constructor(
		private segmentViewService: SegmentViewService,
		private notificationService: NotificationService,
		private fragmentService: FragmentService
	) {
	}

	ngOnInit() {
	}

	update(status: Status, message: string) {
		this.fragment.status = status;
		let [done, fragment] = this.fragmentService.updateFragment(this.fragment);
		this.fragment = fragment;
		if (done) {
			this.notificationService.notify(`Appointment ${message}`, true);
		}
	}

	deny() {
		this.update(Status.denied, 'denied');
	}

	cancel() {
		this.update(Status.cancelled, 'cancelled');
	}

	approve() {
		this.update(Status.approved, 'approved');
	}
}


@Component({
	selector: 'fragment-context',
	template: `
		<div class="fragment__context" *ngIf="fragment && user">
			<fragment-context-student [user]="user" [fragment]="fragment" *ngIf="user.type==0"></fragment-context-student>
			<fragment-context-faculty [user]="user" [fragment]="fragment" *ngIf="user.type==1"></fragment-context-faculty>
		</div>
	`,
	directives: [FragmentContextStudent, FragmentContextFaculty],
	pipes: [TimePipe]
})
class FragmentContext implements OnInit {
	observable: Observable<Fragment>;
	fragment: Fragment;
	user: User;

	constructor(
		private userService: UserService,
		private segmentViewService:SegmentViewService,
		private routeParams: RouteParams,
		private notificationService: NotificationService
	){
	}

	ngOnInit() { 
		this.observable = this.segmentViewService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.fragment = data;
			},
			err => { },
			() => { }
		);

		this.userService.getUser().then(user => this.user = user);
	}
}


@Component({
	selector: 'segment-viewport',
	template: `
		<div class="segment__viewport">
			<day-component [id]="id" [year]="year" [month]="month" [day]="day"></day-component>
			<fragment-context></fragment-context>
		</div>
	`,
	directives: [DayComponent, FragmentContext]
})
export class SegmentViewport {
}




// end