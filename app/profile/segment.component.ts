import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {SegmentViewService} from './segment.view.service';
import {CalendarService, MonthPipe, WeekPipe, WeekFullPipe} from './calendar.service';
import {Time, Template, Segment, Status, Fragment, User, UserType} from '../interfaces/interface';

import {UserService} from '../services/user.service';
import {FragmentService, FragmentResponse} from '../services/fragment.service';
import {SegmentService} from '../services/segment.service';
import {RouterService} from '../services/router.service';
import {Notification, NotificationService} from '../notification.service';

import {RadiusSelectComponent, RadiusRadioComponent, SelectObject} from '../form/form.component';


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
				<span *ngSwitchWhen="5" [innerHTML]="''"></span>
				<span *ngSwitchWhen="6" [innerHTML]="'Blocked'"></span>
			</span>
			<!-- <span class="lnr lnr-pencil" *ngIf="selected"></span> -->

			<div class="fragment__history" *ngIf="users">
				<span *ngFor="#user of users">
					<img src="{{user.meta?.avatar}}" alt="" />
				</span>
			</div>
		</li>
	`,
	pipes: [TimePipe]
})
class FragmentComponent implements OnInit {
	@Input() fragment: Fragment;
	observable: Observable<Fragment>;
	selected: boolean = false;

	users: User[] = [];

	constructor(
		private segmentViewService: SegmentViewService,
		private userService: UserService
	) {}

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
		);

		if ('history' in this.fragment) {
			// for (var i = this.fragment.history.length - 1; i >= 0; i--) {
			// 	this.userService.getUser(this.fragment.history[i].user_id).then(
			// 		user => {
			// 			this.users.push(user);
			// 		});
			// }
		}
	}
}


@Component({
	selector: 'segment-component',
	template: `
		<div class="segment" *ngIf="segment">
			<h3 class="segment__title">
				<span>{{ segment.template.name }}</span>
				<div *ngIf="fragments.length > 0">
					{{fragments[0] | timePipe:false}} - {{fragments[fragments.length-1] | timePipe:true}}
				</div>
			</h3>
			<div class="fragments" *ngIf="fragments">
				<ul>
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
	fragments: Fragment[] = [];

	fragments$: Observable<Fragment[]>;

	constructor(
		private fragmentService: FragmentService,
		private routeParams: RouteParams,
		private calendarService: CalendarService
	) {}

	ngOnInit() {
		this.fragments = this.fragmentService.genFragments(this.segment);

		let [_, date] = this.calendarService.getRouteParams();

		let day = date.getDate(),
				month = date.getMonth(),
				year = date.getFullYear();

		this.fragmentService.getFragments(this.segment).then((fragments) => {
			let fgs = fragments.map((fragment) => {
				fragment.id = fragment._id;
				fragment.segment = this.segment;
				delete fragment._id;
				return fragment;
			});
			this.fragments = this.fragmentService.merge(this.fragments, fgs);
		});

		// this.fragmentService.getFragments(this.segment);

		// this.fragmentService.getFragments(this.segment, month, day, year).then(
		// 	(fragments) => {
		// 		this.fragments = this.fragmentService.validateFragments(
		// 			this.fragmentService.merge(this.fragments, fragments), this.segment);
		// 	});
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
	segments$: Observable<Segment[]>;
	segments: Segment[] = [];

	constructor(
		private calendarService: CalendarService,
		private segmentService: SegmentService,
		private injector: Injector,
		private routerService: RouterService
	) {
	}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();
		let day = date.getDate(), month = date.getMonth(), year = date.getFullYear();

		if(!id) {
			id = this.routerService.UserId;
		}

		this.segments$ = this.segmentService.segments$;
		this.segments$.subscribe(
			(segments) => {
				this.segments = segments;
			});

		this.segmentService.getSegmentsByRoute(id, month, day, year);
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

	constructor(
		private calendarService: CalendarService,
		private segmentViewService: SegmentViewService
	) {}

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
	selector: 'fragment-message',
	template: `
		<div *ngIf="fragment" class="message__wrap">
			<div *ngIf="fragment.message">
				<label>Message:</label>
				<div class="message">
					<span class="icon-message"></span>
					{{fragment.message}}
				</div>
			</div>
			<div *ngIf="fragment.response">
				<label>Response:</label>
				<div *ngFor="#res of fragment.response">
					<div class="response">
						<span class="icon-messages"></span>
						{{res}}
					</div>
				</div>
			</div>
		</div>
	`
})
class FragmentMessage {
	@Input() fragment: Fragment;
}


@Component({
	selector: 'fragment-context-student',
	template: `
		<div class="fragment__ctx">
			<h3 class="ctx__head">
				{{fragment.segment.template.name}}
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
					<fragment-message [fragment]="fragment"></fragment-message>
					<div class="form__group">
						<button class="button type__1" (click)="cancel()">Cancel appointment</button>
					</div>
				</template>
				<template [ngSwitchWhen]="2">
					<div class="ctx__notification">
						<section>
							<label>Notify?</label>
							<radius-radio [on]="true" [intext]="true"></radius-radio>
						</section>
						<section>
							<label>Notification time</label>
							<radius-select [selected]="2" [items]="notify_select" [notification]="true"></radius-select>
						</section>
					</div>
					<strong>Appointment approved</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div class="form__group">
						<button class="button type__1" (click)="cancel()">Cancel appointment</button>
					</div>
				</template>
				<template [ngSwitchWhen]="3">
					<strong>Appointment denied</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
				</template>
				<template [ngSwitchWhen]="4">
					<strong>Appointment cancelled</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
				</template>

				<template [ngSwitchWhen]="5">
					<strong>Appointment time not available</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
				</template>

				<template [ngSwitchWhen]="6">
					<strong>Appointment time blocked by advisor</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
				</template>
				<template ngSwitchDefault>
					<div class="form__group">
						<label for="">Message: </label>
						<textarea [(ngModel)]="message"></textarea>
					</div>
					<div class="form__group">
						<button class="button type__2" (click)="create()">Create appointment</button>
					</div>
				</template>
			</div>
		</div>
	`,
	directives: [FragmentMessage, RadiusSelectComponent, RadiusRadioComponent],
	pipes: [TimePipe]
})
class FragmentContextStudent implements OnInit {
	@Input() fragment: Fragment;
	@Input() user: User;

	message: string;

	notify_select: SelectObject[] = [
		{ value: 10, text: '10 min' },
		{ value: 15, text: '15 min' },
		{ value: 30, text: '30 min' },
		{ value: 60, text: '1 hour' },
		{ value: 120, text: '2 hour' },
		{ value: 1440, text: '1 day' }
	];

	constructor(
		private segmentViewService: SegmentViewService,
		private notificationService: NotificationService,
		private fragmentService: FragmentService
	) {
	}

	ngOnInit() {
	}

	cancel() {
		// if (!('history' in this.fragment)) {
		// 	this.fragment.history = [];
		// }

		// this.fragment.history.push(this.fragment);
		// this.fragment.user_id = "";
		// this.fragment.message = "";
		// this.fragment.response = [];
		// this.fragment.status = Status.default;

		// this.fragment.status = Status.default;
		// this.notificationService.notify("Appointment canceled", true, true);
	}

	create() {
		if (this.fragment.segment.template.require_accept) {
			this.fragment.status = Status.in_progress;
		} else {
			this.fragment.status = Status.approved;
		}

		// this.fragment.message = this.message;
		this.fragment._user = this.user.id;
		this.fragmentService.addFragment(this.fragment);

		this.notificationService.notify(`
			Appointment created for ${this.fragment.segment.template.name} at ${this.fragment.start.hour}:${this.fragment.start.minute}
		`, true, false);

		this.message = '';
	}
}


@Component({
	selector: 'fragment-profile',
	template: `
		<div *ngIf="user" class="ctx__profile">
			<section>
				<img src="{{user.meta?.avatar}}" />
			</section>
			<section>
				<h5>{{user.fname}} {{user.lname}}</h5>
				{{user.email}}
			</section>
		</div>
	`
})
class FragmentProfile {
	@Input() user;
}


@Component({
	selector: 'fragment-context-faculty',
	template: `
		<div class="fragment__ctx">
			{{fragment.id}}
			<h3 class="ctx__head">
				{{fragment.segment.template.name}}
			</h3>
			<div class="date__time">
				From: <span>{{fragment | timePipe:false}}</span> To: <span>{{fragment | timePipe:true}}</span>
			</div>
			<div>
				Location: N/A
			</div>
			<div [ngSwitch]="fragment.status" class="ctx__controls">
				<template [ngSwitchWhen]="1">
					<fragment-profile [user]="template_user"></fragment-profile>
					<strong>Appointment not approved yet</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div class="form__group">
						<label for="">Response:</label>
						<textarea [(ngModel)]="response"></textarea>
					</div>
					<div class="form__group">
						<button class="button type__3" (click)="approve()">Approve appointment</button>
					</div>
					<div class="cancels">
						<a (click)="deny()">Deny appointment</a>
						<a href="">Deny and make unavailable</a>
					</div>
				</template>

				<template [ngSwitchWhen]="2">
					<div class="ctx__notification">
						<section>
							<label>Notify?</label>
							<radius-radio [on]="true" [intext]="true"></radius-radio>
						</section>
						<section>
							<label>Notification time</label>
							<radius-select [selected]="2" [items]="notify_select" [notification]="true"></radius-select>
						</section>
					</div>
					<fragment-profile [user]="template_user"></fragment-profile>
					<strong>Appointment approved</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div class="form__group">
						<label for="">Response:</label>
						<textarea [(ngModel)]="response"></textarea>
					</div>
					<div class="form__group">
						<button class="button type__1" (click)="cancel()">Cancel appointment</button>
					</div>
					<div class="cancels">
						<a href="">Cancel and make unavailable for everyone</a>
					</div>
				</template>

				<template [ngSwitchWhen]="3">
					<strong>Appointment denied</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div class="cancels">
						<a (click)="block()">Block interval for everyone</a>
					</div>
				</template>

				<template [ngSwitchWhen]="4">
					<fragment-profile [user]="template_user"></fragment-profile>
					<strong>Appointment cancelled</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div class="cancels">
						<a (click)="block()">Block interval for everyone</a>
					</div>
				</template>

				<template [ngSwitchWhen]="6">
					<strong>Appointment blocked for everyone</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div class="cancels">
						<a (click)="open()">Unblock interval</a>
					</div>
				</template>
				<template ngSwitchDefault>
					<button class="button type__1" (click)="block()">Block interval</button>
				</template>
			</div>
		</div>
	`,
	directives: [FragmentMessage, FragmentProfile, RadiusRadioComponent, RadiusSelectComponent],
	pipes: [TimePipe]
})
class FragmentContextFaculty implements OnInit {
	@Input() fragment: Fragment;
	@Input() user: User;

	template_user: User;
	response: string = '';

	notification$: Observable<Notification>;
	user$: Observable<User>;
	fragment$: Observable<FragmentResponse>;

	notify_select: SelectObject[] = [
		{ value: 10, text: '10 min' },
		{ value: 15, text: '15 min' },
		{ value: 30, text: '30 min' },
		{ value: 60, text: '1 hour' },
		{ value: 120, text: '2 hour' },
		{ value: 1440, text: '1 day' }
	];

	constructor(
		private segmentViewService: SegmentViewService,
		private notificationService: NotificationService,
		private fragmentService: FragmentService,
		private userService: UserService
	) {
	}

	ngOnInit() {
		this.notification$ = this.fragmentService.notification$;
		this.notification$.subscribe(
			(response) => {
				this.notificationService.notify(response.message, true, !response.type);
			});

		this.fragment$ = this.fragmentService.fragment$;
		this.fragment$.subscribe(
			(response : FragmentResponse) => {
				if (this.fragment.id == response.id) {
					if ('fragment' in response) {
						this.fragment = response.fragment;
					}
				}
			});
	}

	ngOnChanges() {
		this.user$ = this.userService.user$;
		this.user$.subscribe(
			(user) => {
				this.template_user = user;
			});
		if (this.fragment._user) {
			this.userService.getUser(this.fragment._user);
		}
	}

	update(status: Status, response: boolean = false) {
		if (!response) {
			if (!('response' in this.fragment)) {
				this.fragment.response = [];
			}

			if (this.response.trim().length > 0) {
				this.fragment.response.push(this.response.trim());
			}
		}

		let fragment = this.fragment;
		fragment.status = status;
		this.fragmentService.updateFragment(fragment);

		this.response = '';
	}


	deny() {
		this.update(Status.denied);
	}

	cancel() {
		this.update(Status.cancelled);
	}

	approve() {
		this.update(Status.approved);
	}

	open() {
		this.update(Status.default);
	}

	block() {
		this.update(Status.blocked);
	}
}


@Component({
	selector: 'fragment-context',
	template: `
		<div class="fragment__context" *ngIf="fragment && session && !(unauthorized)">
			<fragment-context-student [user]="session" [fragment]="fragment" *ngIf="session.type==0"></fragment-context-student>
			<fragment-context-faculty [user]="session" [fragment]="fragment" *ngIf="session.type==1"></fragment-context-faculty>
		</div>
		<div class="fragment__context" *ngIf="fragment && unauthorized">
			<h3>Nothing to see here</h3>
		</div>
	`,
	directives: [FragmentContextStudent, FragmentContextFaculty],
	pipes: [TimePipe],
	providers: [CalendarService]
})
class FragmentContext implements OnInit {
	observable: Observable<Fragment>;
	fragment: Fragment;
	session: User;

	unauthorized: boolean = false;

	constructor(
		private userService: UserService,
		private segmentViewService:SegmentViewService,
		private routeParams: RouteParams,
		private notificationService: NotificationService,
		private calendarService: CalendarService,
		private routerService: RouterService
	){
	}

	ngOnInit() { 
		let uid = this.routerService.UserId;

		this.observable = this.segmentViewService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.fragment = data;
			},
			err => { },
			() => { }
		);

		this.userService.getUser().then(user => {
			if (user.type == UserType.Faculty && user.id !== uid) {
				this.unauthorized = true;
			}
			this.session = user;
		});
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