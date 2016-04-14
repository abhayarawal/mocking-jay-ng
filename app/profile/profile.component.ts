import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams, OnActivate, ComponentInstruction} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {LayoutHeader} from '../layouts/header.layout';
import {Calendar} from './calendar.component';
import {User, UserType, Faculty} from '../interfaces/interface';

import {AuthService} from '../auth/auth.service';
import {UserService} from '../services/user.service';
import {CalendarService} from './calendar.service';
import {SegmentViewport} from './segment.component';
import {FacultyService} from '../services/faculty.service';
import {NotificationService} from '../notification.service';
import {RouterService} from '../services/router.service';


@Component({
	selector: 'profile-context',
	template: `
		<div class="profile__context">
			<div class="row">
				<section>
					<ul>
						<li>
							<a href="">
								Professors <span class="lnr lnr-chevron-down"></span>
							</a>
						</li>
						<li><a href="">Today's Events</a></li>
						<li><a class="selected" [routerLink]="['/ProfileViewport', 'CalendarRouter', {id: id}, 'DaySegment', {month: month, day: day, year: year}]">Calendar</a></li>
					</ul>
				</section>
				<section class="context__header">
					<h4>
						<span class="lnr lnr-star"></span>
						Taylor Swifts calendar
					</h4>
				</section>
				<section>
					<ul>
						<li><a href="" class="lnr lnr-sync"></a></li>
						<li><a href="">Today</a></li>
						<li><a (click)="prevDay()" class="lnr lnr-chevron-left"></a></li>
						<li><a (click)="nextDay()" class="lnr lnr-chevron-right"></a></li>
					</ul>
				</section>
			</div>
		</div>
	`,
	directives: [RouterLink]
})
class ProfileContext implements OnInit {
	@Input() day: string = "";
	@Input() month: string = "";
	@Input() year: string = "";
	@Input() id: string = "";

	constructor(private router: Router) {}

	getDate(year, month, day): Date {
		return new Date(parseInt(year), parseInt(month), (parseInt(day)));
	}

	prevDay(): void {
		let prev = this.getDate(this.year, this.month, parseInt(this.day)-1);
		this.router.navigateByUrl(`/calendar/${this.id}/day/${prev.getMonth()}/${prev.getDate()}/${prev.getFullYear()}`);
	}

	nextDay(): void {
		let next = this.getDate(this.year, this.month, parseInt(this.day)+1);
		this.router.navigateByUrl(`/calendar/${this.id}/day/${next.getMonth()}/${next.getDate()}/${next.getFullYear()}`);
	}

	ngOnInit() {
	}

	get today() {
		let date = this.getDate(this.year, this.month, this.day);
		return `${date.toString().match(/([\w]+\s){1,4}/i)[0].trim()}`;
	}
}

@Component({
	selector: 'profile-nav',
	template: `
		<div class="profile__nav">
			<div class="profile__card" *ngIf="user">
				<img src="{{user.meta?.avatar}}" />
				<h3>
					{{user.fname}} {{user.lname}}
				</h3>
				<div class="profile__mail"><a href="mailto:{{user.email}}">{{user.email}}</a></div>
				<ul>
					<li *ngIf="type==0 && user.type!=0">
						<a class="lnr lnr-pushpin" (click)="togglePin()" [ngClass]="{pinned: pinned}"></a>
					</li>
					<li><a class="lnr lnr-license"></a></li>
					<li><a [routerLink]="['/ProfileViewport', 'CalendarRouter', {id: user.id}]" class="lnr lnr-calendar-full"></a></li>
					<li><a href="" class="lnr lnr-download"></a></li>
				</ul>
			</div>
			<calendar [id]="user.id" *ngIf="user"></calendar>
			<div class="faculty__list" *ngIf="user">
				<ul *ngIf="type==0 && users">
					<li *ngFor="#usr of users">
						<a [routerLink]="['/ProfileViewport', 'Calendar', {id: usr.id}]">
							<img src="{{usr.meta?.avatar}}" alt="" />
							<section>
								<span>{{usr.fname}} {{usr.lname}}</span>
								<span>{{usr.email}}</span>
							</section>
						</a>
					</li>
				</ul>
			</div>
		</div>
	`,
	directives: [Calendar, RouterLink]
})
class ProfileNav implements OnInit {
	@Input() user: User;

	day: String = '';
	month: String = '';
	year: String = '';

	type: UserType;
	pinned: boolean;
	users: User[];
	observable: Observable<Faculty[]>;

	constructor(
		private authService: AuthService,
		private facultyService: FacultyService,
		private router: Router,
		private notificationService: NotificationService,
		private userService: UserService
	) { }

	ngOnInit() {
		let day = new Date();
		this.day = `${day.getDate()}`;
		this.month = `${day.getMonth()}`;
		this.year = `${day.getFullYear()}`;

		this.observable = this.facultyService.observable$;
		this.observable.subscribe(
			(faculties) => {
				this.users = [];
				faculties.forEach(faculty => {
					this.userService.getUser(faculty.faculty_id).then(
						user => { this.users.push(user); });
				});
			}
		);

		let [_, session] = this.authService.getSession();
		this.type = session.type;

		this.facultyService.triggerObservable();
	}

	togglePin() {
		this.pinned = this.facultyService.toggleFaculty(this.user);
		if (this.pinned) {
			this.notificationService.notify('Faculty added to your list', true);
		} else {
			this.notificationService.notify('Faculty removed from your list', true, true);
		}
	}

	ngOnChanges() {
		if (this.user) {
			this.pinned = this.facultyService.inFaculty(this.user);
		}
	}
}

@Component({
	template: `
		<div class="profile__outlet">
			<h2>Viewing</h2>
		</div>
	`,
	directives: [ProfileNav]
})
class Cal implements OnInit {
	constructor(
		private userService: UserService,
		private routeParams: RouteParams
	) { }

	ngOnInit() {
	}
}

@Component({
	template: `
		<profile-nav [user]="user"></profile-nav>
		<div class="profile__outlet">
			<h2>Upcoming events</h2>
		</div>
	`,
	directives: [ProfileNav]
})
class None implements OnInit{
	user: User;

	constructor(
		private userService: UserService,
		private routeParams: RouteParams,
		private router: Router,
		private authService: AuthService
	) { }

	ngOnInit() {
		this.userService.getUser().then(user => this.user = user);
	}
}


@Component({
	selector: 'day-segment',
	template: `
		<div class="profile__outlet">
			<profile-context [id]="id" [month]="month" [year]="year" [day]="day"></profile-context>
			<segment-viewport [id]="id" [month]="month" [year]="year" [day]="day"></segment-viewport>
		</div>
	`,
	directives: [ProfileContext, SegmentViewport, ProfileNav],
	providers: [CalendarService]
})
class DaySegment implements OnInit {
	@Input() day;
	@Input() month;
	@Input() year;

	id: string = "";
	user: User;
	user$: Observable<User>;

	constructor(
		private router: Router,
		private userService: UserService,
		private calendarService: CalendarService
	){}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();

		this.id = id;
		this.day = date.getDate(),
		this.month = date.getMonth(),
		this.year = date.getFullYear();
	}
}

@Component({
	template: `
		<profile-nav [user]="user"></profile-nav>
		<router-outlet></router-outlet>
	`,
	directives: [RouterOutlet, ProfileNav]
})
@RouteConfig([
	{ path: '/', name: 'Calendar', component: Cal, useAsDefault: true },
	{ path: '/day/:month/:day/:year', name: 'DaySegment', component: DaySegment }
])
class CalendarRouter implements OnInit, OnActivate {
	user: User;
	user$: Observable<User>;

	constructor(
		private routeParams: RouteParams,
		private userService: UserService,
		private routerService: RouterService
	){}

	routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    return new Promise(resolve => {
			resolve(this.routerService.UserId = this.routeParams.get("id"));
    });
  }

	ngOnInit() {
		this.user$ = this.userService.user$;
		this.user$.subscribe(
			(user) => {
				this.user = user;
			});

		this.userService.getUser(this.routeParams.get('id'));
	}
}


@Component({
	template: `
		<div class="profile__viewport">
			<router-outlet></router-outlet>
		</div>
	`,
	directives: [RouterLink, RouterOutlet],
	providers: [CalendarService]
})
@RouteConfig([
	{ path: '/', name: 'None', component: None, useAsDefault: true },
	{ path: '/:id/...', name: 'CalendarRouter', component: CalendarRouter }
])
export class ProfileViewport {
	constructor() {
	}
}





